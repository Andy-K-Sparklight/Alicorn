//! Raw and XZ-compressed embedded data.
//!
//! Note: The exact path of this module is relied upon by `alicorn-build` to
//! generate embedded data modules. If you move or rename it, make sure to check
//! the sources there, since your editor isn't likely going to update it.

use std::io::Read;

use lzma_rust2::XzReader;

/// Embedded bytes stored raw or compressed with XZ.
pub struct EmbeddedData<'a> {
    bytes: &'a [u8],
    encoding: Encoding,
}

/// Storage format and the expected size of compressed content after decoding.
enum Encoding {
    #[cfg(debug_assertions)]
    Raw,
    #[cfg(debug_assertions)]
    Path,
    Xz {
        decoded_len: usize,
    },
}

impl<'a> EmbeddedData<'a> {
    /// Constructs an XZ resource with the given bytes and decoded length.
    ///
    /// The stream must fit a 128 MiB LZMA2 decoder memory limit.
    pub const fn new(bytes: &'a [u8], decoded_len: usize) -> Self {
        Self {
            bytes,
            encoding: Encoding::Xz { decoded_len },
        }
    }

    /// Constructs a resource from uncompressed bytes.
    #[cfg(debug_assertions)]
    pub const fn new_raw(bytes: &'a [u8]) -> Self {
        Self {
            bytes,
            encoding: Encoding::Raw,
        }
    }

    /// Loads the data from filesystem.
    #[cfg(debug_assertions)]
    pub const fn by_path(bytes: &'a [u8]) -> Self {
        Self {
            bytes,
            encoding: Encoding::Path,
        }
    }

    /// Copies raw content or decompresses XZ content into an immutable
    /// heap-allocated slice.
    ///
    /// # Panics
    ///
    /// Panics if an XZ stream is invalid, exceeds the decoder memory limit,
    /// has a different decoded length, or contains trailing bytes.
    pub fn decode(&self) -> Box<[u8]> {
        #[cfg(debug_assertions)]
        if matches!(self.encoding, Encoding::Path) {
            let p = std::path::Path::new(
                str::from_utf8(self.bytes).expect("Path should be valid UTF-8"),
            );
            return std::fs::read(p)
                .expect("Embedded file should be available")
                .into_boxed_slice();
        }

        #[cfg(debug_assertions)]
        if matches!(self.encoding, Encoding::Raw) {
            return self.bytes.into();
        }

        let Encoding::Xz { decoded_len } = self.encoding else {
            unreachable!("Embedded data should be in the compressed form");
        };

        let mut bytes = vec![0; decoded_len].into_boxed_slice();
        let mut decoder = XzReader::new_mem_limit(self.bytes, false, 128 * 1024);
        decoder
            .read_exact(&mut bytes)
            .expect("Embedded data should contain a valid XZ stream");
        assert_eq!(
            decoder
                .read(&mut [0])
                .expect("Embedded XZ streams should finish"),
            0,
            "Embedded XZ data should match its declared length"
        );
        assert!(
            decoder.into_inner().is_empty(),
            "Embedded XZ streams should consume all their input"
        );
        bytes
    }
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use lzma_rust2::XzOptions;
    use lzma_rust2::XzWriter;

    use super::*;

    /// Encodes a fixture with a dictionary that fits the embedded decoder
    /// limit.
    fn encode(bytes: &[u8]) -> Vec<u8> {
        let mut options = XzOptions::with_preset(6);
        options.lzma_options.dict_size = 4096;
        let mut encoder =
            XzWriter::new(Vec::new(), options).expect("Fixture XZ options should be valid");
        encoder.write_all(bytes).expect("Fixture should compress");
        encoder.finish().expect("Fixture compression should finish")
    }

    /// Binary and empty embedded XZ streams decode to their exact source bytes.
    #[test]
    fn embedded_xz_output() {
        for bytes in [b"\0font\xfffont\0font".as_slice(), b""] {
            let compressed = encode(bytes);
            assert_eq!(
                &*EmbeddedData::new(&compressed, bytes.len()).decode(),
                bytes,
                "Embedded XZ bytes should round-trip exactly"
            );
        }
    }

    /// Incorrect decoded lengths, truncated streams, and trailing bytes fail
    /// decoding.
    #[test]
    fn embedded_xz_invalid_stream() {
        let bytes = b"font bytes";
        let compressed = encode(bytes);
        for length in [bytes.len() - 1, bytes.len() + 1] {
            std::panic::catch_unwind(|| EmbeddedData::new(&compressed, length).decode())
                .expect_err("Incorrect embedded XZ lengths should fail decoding");
        }
        let truncated = &compressed[..compressed.len() - 1];
        std::panic::catch_unwind(|| EmbeddedData::new(truncated, bytes.len()).decode())
            .expect_err("Truncated embedded XZ streams should fail decoding");
        let mut trailing = compressed;
        trailing.push(0);
        std::panic::catch_unwind(|| EmbeddedData::new(&trailing, bytes.len()).decode())
            .expect_err("Trailing embedded XZ bytes should fail decoding");
    }

    /// Embedded streams exceeding the 128 MiB decoder memory limit fail
    /// decoding.
    #[test]
    fn embedded_xz_memory_limit() {
        let mut options = XzOptions::with_preset(0);
        options.lzma_options.dict_size = 128 << 20;
        let mut encoder =
            XzWriter::new(Vec::new(), options).expect("Fixture XZ options should be valid");
        encoder.write_all(b"data").expect("Fixture should compress");
        let compressed = encoder.finish().expect("Fixture compression should finish");
        std::panic::catch_unwind(|| EmbeddedData::new(&compressed, 4).decode())
            .expect_err("Oversized XZ dictionaries should fail decoding");
    }
}
