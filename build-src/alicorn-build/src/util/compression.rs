use std::io::Write;

use lzma_rust2::XzOptions;
use lzma_rust2::XzWriter;

/// Compresses the supplied bytes using XZ.
pub fn compress(bytes: &[u8], level: u32) -> std::io::Result<Vec<u8>> {
    let mut encoder = XzWriter::new(Vec::new(), XzOptions::with_preset(level))?;
    encoder.write_all(bytes)?;
    encoder.finish()
}
