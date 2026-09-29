//! File hashing.

use std::io::Read;
use std::path::Path;
use std::path::PathBuf;

use sha1::Digest;
use sha1::Sha1;

/// A file-hashing failure.
#[derive(Debug, thiserror::Error)]
pub enum HashError {
    /// The requested algorithm is unsupported.
    #[error("Unsupported hash algorithm: {0}")]
    UnsupportedAlgorithm(String),

    /// The file could not be opened or read.
    #[error("Failed to hash file: {}: {source}", path.display())]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
}

/// Returns the hash of `path` as lowercase hexadecimal.
///
/// Accepts `sha1` and `sha-1`, ignoring ASCII case.
///
/// Returns [`HashError::UnsupportedAlgorithm`] for other names or
/// [`HashError::Io`] if the file cannot be opened or read.
pub fn hash_file(path: &Path, algorithm: &str) -> Result<String, HashError> {
    match algorithm.to_ascii_lowercase().as_str() {
        "sha1" | "sha-1" => hash_sha1(path).map_err(|source| HashError::Io {
            path: path.to_owned(),
            source,
        }),
        _ => Err(HashError::UnsupportedAlgorithm(algorithm.to_owned())),
    }
}

/// Returns the SHA-1 hash of `path` as lowercase hexadecimal.
fn hash_sha1(path: &Path) -> std::io::Result<String> {
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha1::new();
    let mut buffer = [0; 64 * 1024];

    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    Ok(to_hex(&hasher.finalize()))
}

/// Encodes each byte as two lowercase hexadecimal digits.
fn to_hex(bytes: &[u8]) -> String {
    let mut output = String::with_capacity(bytes.len().checked_mul(2).unwrap_or(0));
    for byte in bytes {
        output.push_str(&format!("{byte:02x}"));
    }
    output
}
