//! Compressed embedded data.
//!
//! Note: If you rename of move this module, make sure to update the
//! corresponding path in `alicorn-build` as the code generation template isn't
//! likely going to be automatically updated by your editor.

use flate2::Decompress;
use flate2::FlushDecompress;
use flate2::Status;

/// Describes embedded zlib-compressed data.
pub struct EmbeddedData<'a> {
    bytes: &'a [u8],
    decoded_len: usize,
}

impl<'a> EmbeddedData<'a> {
    /// Constructs a new constant with the given bytes and decoded length.
    ///
    /// This value is designed to be invoked from generated sources.
    pub const fn new(bytes: &'a [u8], decoded_len: usize) -> Self { Self { bytes, decoded_len } }

    /// Decompresses the stored content into an immutable heap-allocated slice.
    ///
    /// # Panics
    ///
    /// Panics if decompression fails. In debug builds, also panics if the
    /// stream does not finish, has an incorrect decoded length, or has
    /// trailing bytes.
    pub fn decode(&self) -> Box<[u8]> {
        let mut bytes = vec![0; self.decoded_len].into_boxed_slice();
        let mut decoder = Decompress::new(true);
        let status = decoder
            .decompress(self.bytes, &mut bytes, FlushDecompress::Finish)
            .expect("Embedded data should contain a valid zlib stream");

        debug_assert_eq!(
            status,
            Status::StreamEnd,
            "Embedded streams should finish within their declared length"
        );
        debug_assert_eq!(
            decoder.total_out(),
            self.decoded_len as u64,
            "Embedded data should match its declared length"
        );
        debug_assert_eq!(
            decoder.total_in(),
            self.bytes.len() as u64,
            "Embedded streams should consume all their input"
        );

        bytes
    }
}
