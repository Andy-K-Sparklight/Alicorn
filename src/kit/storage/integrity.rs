//! Content hashing and verification.

use core::str::FromStr;
use std::fs::File;
use std::io::ErrorKind;
use std::io::Read;
use std::path::Path;
use std::path::PathBuf;

use thiserror::Error;

mod cccrypt;
mod cng;
mod rust;

/// A hasher which digests data and compares/emits a hash value.
#[static_dispatch::setup]
pub trait HashProvider {
    /// Appends `data` to the message being hashed.
    fn update(&mut self, data: &[u8]);

    /// Consumes this hasher and invokes `consume` with the digest bytes.
    fn digest_with<R>(self, consume: impl FnOnce(&mut [u8]) -> R) -> R;

    /// Consumes this hasher and compares its digest with `hex`.
    ///
    /// Returns `false` if `hex` is malformed or has the wrong length.
    fn digest_compare_hex(self, hex: &str) -> bool;

    /// Digests this hasher, encodes the output as lowercase hex value, and
    /// formats it into `writer`.
    fn digest_fmt_hex(self, writer: &mut impl core::fmt::Write) -> core::fmt::Result;
}

/// A hash algorithm.
#[derive(Copy, Clone)]
pub enum HashAlgo {
    Md5,
    Sha1,
    Sha256,
    Sha512,
}

macro_rules! match_algo_by_name {
    (
        $v:expr;
        $(
            $($st:expr),+ => $algo:expr
        )*
    ) => {
        match $v {
            $(
                s if $(s.eq_ignore_ascii_case($st)) || + => Some($algo),
            )*
            _ => None
        }
    };
}

impl FromStr for HashAlgo {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match_algo_by_name!(s;
          "md5" => Self::Md5
          "sha1", "sha-1" => Self::Sha1
          "sha256", "sha-256" => Self::Sha256
          "sha512", "sha-512" => Self::Sha512
        )
        .ok_or(())
    }
}

/// Requests a [`HashProvider`] of the given [`HashAlgo`].
pub fn hasher_of(algo: HashAlgo) -> impl HashProvider {
    cfg_select! {
        use_rust_crypto => rust::AnyRustHasher::of(algo),
        use_common_crypto => cccrypt::AnyAppleHasher::of(algo),
        use_cng => cng::AnyWindowsHasher::of(algo),
        _ => compile_error!("No hash backend available"),
    }
}

/// An I/O failure while opening or hashing a file.
#[derive(Debug, Error)]
#[error("Could not hash file {path}: {source}")]
pub struct FileHashError {
    pub path: PathBuf,
    #[source]
    pub source: std::io::Error,
}

/// Hashes the remaining bytes in `reader` and returns lowercase hexadecimal.
///
/// Retries interrupted reads.
///
/// # Errors
///
/// Returns an error if reading fails.
pub fn hash_reader(reader: &mut impl Read, algo: HashAlgo) -> std::io::Result<String> {
    let hasher = read_hasher(reader, algo)?;
    let capacity = match algo {
        HashAlgo::Md5 => 32,
        HashAlgo::Sha1 => 40,
        HashAlgo::Sha256 => 64,
        HashAlgo::Sha512 => 128,
    };
    let mut hex = String::with_capacity(capacity);
    hasher
        .digest_fmt_hex(&mut hex)
        .expect("Digest formatting into a String should succeed");
    Ok(hex)
}

/// Hashes the remaining bytes in `reader` and compares the digest with
/// `expected`.
///
/// Returns `false` for malformed hexadecimal, an incorrect length, or a
/// different digest. Retries interrupted reads.
///
/// # Errors
///
/// Returns an error if reading fails, including when `expected` is malformed.
pub fn verify_reader(
    reader: &mut impl Read,
    algo: HashAlgo,
    expected: &str,
) -> std::io::Result<bool> {
    Ok(read_hasher(reader, algo)?.digest_compare_hex(expected))
}

/// Hashes the file at `path` and returns lowercase hexadecimal.
///
/// # Errors
///
/// Returns the path and underlying I/O error if opening or reading the file
/// fails.
pub fn hash_file(path: &Path, algo: HashAlgo) -> Result<String, FileHashError> {
    File::open(path)
        .and_then(|mut file| hash_reader(&mut file, algo))
        .map_err(|source| FileHashError {
            path: path.to_path_buf(),
            source,
        })
}

/// Hashes the file at `path` and compares the digest with `expected`.
///
/// Returns `false` for malformed hexadecimal, an incorrect length, or a
/// different digest.
///
/// # Errors
///
/// Returns the path and underlying I/O error if opening or reading the file
/// fails, including when `expected` is malformed.
pub fn verify_file(path: &Path, algo: HashAlgo, expected: &str) -> Result<bool, FileHashError> {
    File::open(path)
        .and_then(|mut file| verify_reader(&mut file, algo, expected))
        .map_err(|source| FileHashError {
            path: path.to_path_buf(),
            source,
        })
}

/// Feeds the remaining reader contents into a hasher, retrying interrupted
/// reads.
fn read_hasher(reader: &mut impl Read, algo: HashAlgo) -> std::io::Result<impl HashProvider> {
    let mut hasher = hasher_of(algo);
    let mut buffer = [0; 16 * 1024];
    loop {
        match reader.read(&mut buffer) {
            Ok(0) => return Ok(hasher),
            Ok(len) => hasher.update(&buffer[..len]),
            Err(error) if error.kind() == ErrorKind::Interrupted => {}
            Err(error) => return Err(error),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use super::*;

    const DATA: &[u8] = b"abc";
    const MALFORMED: &str = "zz";

    struct Fixture {
        algo: HashAlgo,
        correct: &'static str,
        incorrect: &'static str,
    }

    const FIXTURES: [Fixture; 4] = [
        Fixture {
            algo: HashAlgo::Md5,
            correct: "900150983cd24fb0d6963f7d28e17f72",
            incorrect: "d41d8cd98f00b204e9800998ecf8427e",
        },
        Fixture {
            algo: HashAlgo::Sha1,
            correct: "a9993e364706816aba3e25717850c26c9cd0d89d",
            incorrect: "cb4cc28df0fdbe0ecf9d9662e294b118092a5735",
        },
        Fixture {
            algo: HashAlgo::Sha256,
            correct: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            incorrect: "a52d159f262b2c6ddb724a61840befc36eb30c88877a4030b65cbe86298449c9"  ,
        },
        Fixture {
            algo: HashAlgo::Sha512,
            correct: "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
            incorrect: "1a9840c27a5cf22dab060cdd8a83da2b0fbcb1aeb52d4f9d3894b639083e205a5ab3f6afaeeb21b8e99b5e0fe93daafaabeef274da5d6eadcc9db36e5b6f64c4",
        },
    ];

    /// The selected backend accepts the known digest for each algorithm.
    #[test]
    fn accept_correct() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            assert!(
                hasher.digest_compare_hex(fixture.correct),
                "Digest should match",
            );
        }
    }

    /// The selected backend formats each algorithm's known digest as lowercase
    /// hex.
    #[test]
    fn format_correctly() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            let mut out = String::new();
            hasher
                .digest_fmt_hex(&mut out)
                .expect("Hash should be written");
            assert_eq!(out, fixture.correct, "Hash hex should match");
        }
    }

    /// Raw finalization passes each algorithm's digest to the callback and
    /// returns its result.
    #[test]
    fn digest_bytes() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            let hex = hasher.digest_with(|bytes| faster_hex::hex_string(&*bytes));
            assert_eq!(
                hex, fixture.correct,
                "Raw digest bytes should match the known vector"
            );
        }
        assert!(
            matches!("MD5".parse(), Ok(HashAlgo::Md5)),
            "MD5 algorithm name should parse case-insensitively"
        );

        assert!(
            "MD-5".parse::<HashAlgo>().is_err(),
            "MD5 algorithm name should not accept hyphens"
        );
    }

    /// The selected backend rejects a valid, same-length digest of different
    /// data.
    #[test]
    fn reject_incorrect() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            assert!(
                !hasher.digest_compare_hex(fixture.incorrect),
                "Digest {} should differ",
                fixture.incorrect,
            );
        }
    }

    /// The selected backend rejects the same malformed hex value for every
    /// algorithm.
    #[test]
    fn reject_malformed() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            assert!(
                !hasher.digest_compare_hex(MALFORMED),
                "Malformed hex should be rejected",
            );
        }
    }

    /// Empty and multi-buffer readers produce known digests for every
    /// algorithm.
    #[test]
    fn hash_reader_output() {
        let fixtures = [
            (
                HashAlgo::Md5,
                "d41d8cd98f00b204e9800998ecf8427e",
                "9bb57f821953f3c232116e38badc8e96",
            ),
            (
                HashAlgo::Sha1,
                "da39a3ee5e6b4b0d3255bfef95601890afd80709",
                "7e7308ef97590bcb05f9543bee280fb91976e90c",
            ),
            (
                HashAlgo::Sha256,
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "cc17faaad36649c4603dda4d8ff97cb149722af0bcac0746305a2134ad2d0b97",
            ),
            (
                HashAlgo::Sha512,
                "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
                "4ac47b5804bb5178ecdca52aeceb71341d2f1f2b3e9fc622183920fde1ef16e17bc8b6ac49819968cdf8d122c8450afd74c0d482ec4068254fb13bd50f5551bf",
            ),
        ];
        let data = [b'a'; 20_000];
        for (algo, empty, filled) in fixtures {
            for (mut input, expected) in [(&[][..], empty), (&data[..], filled)] {
                let mut reader = input;
                assert_eq!(
                    hash_reader(&mut reader, algo).expect("Reader hashing should succeed"),
                    expected,
                    "Reader digest should match the known vector",
                );
                assert!(
                    verify_reader(&mut input, algo, expected)
                        .expect("Reader verification should succeed"),
                    "Reader digest should verify against the known vector",
                );
            }
        }
    }

    /// File hashing agrees with reader hashing and distinguishes invalid
    /// digests from I/O failures.
    #[test]
    fn file_hash_verification() {
        let dir = tempfile::tempdir().expect("Temporary directory should be created");
        let path = dir.path().join("content");
        File::create(&path)
            .expect("Input file should be created")
            .write_all(DATA)
            .expect("Input file should be written");
        for fixture in FIXTURES {
            let mut reader = DATA;
            assert_eq!(
                hash_file(&path, fixture.algo).expect("File hashing should succeed"),
                hash_reader(&mut reader, fixture.algo).expect("Reader hashing should succeed"),
                "File and reader digests should agree",
            );
            for (expected, matches) in [
                (fixture.correct, true),
                (fixture.incorrect, false),
                (MALFORMED, false),
            ] {
                let mut reader = DATA;
                assert_eq!(
                    verify_file(&path, fixture.algo, expected)
                        .expect("File verification should succeed"),
                    matches,
                    "File verification should distinguish matching digests",
                );
                assert_eq!(
                    verify_reader(&mut reader, fixture.algo, expected)
                        .expect("Reader verification should succeed"),
                    matches,
                    "Reader verification should distinguish matching digests",
                );
            }
        }

        let missing = dir.path().join("missing");
        let errors = [
            hash_file(&missing, HashAlgo::Sha256).expect_err("Missing file should fail hashing"),
            verify_file(&missing, HashAlgo::Sha256, MALFORMED)
                .expect_err("Missing file should fail verification"),
        ];
        for error in errors {
            assert_eq!(error.path, missing, "Error should retain the input path");
            assert_eq!(
                error.source.kind(),
                ErrorKind::NotFound,
                "Error should retain the underlying I/O failure",
            );
        }
    }

    /// A reader that interrupts once before returning its contents.
    struct InterruptedReader {
        remaining: &'static [u8],
        interrupted: bool,
    }

    impl Read for InterruptedReader {
        fn read(&mut self, buffer: &mut [u8]) -> std::io::Result<usize> {
            if !self.interrupted {
                self.interrupted = true;
                return Err(ErrorKind::Interrupted.into());
            }
            self.remaining.read(buffer)
        }
    }

    /// Hashing and verification retry interrupted reads without losing input.
    #[test]
    fn reader_hash_interrupted() {
        let reader = || InterruptedReader {
            remaining: DATA,
            interrupted: false,
        };
        let fixture = &FIXTURES[0];
        assert_eq!(
            hash_reader(&mut reader(), fixture.algo).expect("Interrupted hashing should retry"),
            fixture.correct,
            "Digest should include all input after interruption",
        );
        assert!(
            verify_reader(&mut reader(), fixture.algo, fixture.correct)
                .expect("Interrupted verification should retry"),
            "Digest should verify after interruption",
        );
    }

    /// A reader that reports a permanent I/O failure.
    struct FailedReader;

    impl Read for FailedReader {
        fn read(&mut self, _: &mut [u8]) -> std::io::Result<usize> {
            Err(ErrorKind::PermissionDenied.into())
        }
    }

    /// Reader failures propagate even when the expected digest is malformed.
    #[test]
    fn reader_hash_io_error() {
        let errors = [
            hash_reader(&mut FailedReader, HashAlgo::Sha256)
                .expect_err("Failed reading should fail hashing"),
            verify_reader(&mut FailedReader, HashAlgo::Sha256, MALFORMED)
                .expect_err("Failed reading should fail verification"),
        ];
        for error in errors {
            assert_eq!(
                error.kind(),
                ErrorKind::PermissionDenied,
                "Reader error should propagate unchanged",
            );
        }
    }
}
