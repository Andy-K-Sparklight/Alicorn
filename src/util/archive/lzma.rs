//! Synchronous decompression of LZMA files.

use std::fs::File;
use std::path::Path;

use crate::util::fs::DraftFile;

/// Inflates the file content at `src`, places a new file containing the
/// decompressed content at `dst`, and returns that file.
///
/// Creates missing prefix components of `dst`.
///
/// If `dst` already exists, this method tries to replace it after inflating.
///
/// Both `src` and `dst` are not affected if the inflation fails.
pub fn inflate(src: &Path, dst: &Path) -> std::io::Result<File> {
    let out = {
        let f = File::open(src)?;
        let mut reader = lzma_rust2::LzmaReader::new_mem_limit(f, u32::MAX, None)?;

        let mut draft = DraftFile::new(dst)?;
        std::io::copy(&mut reader, draft.as_file_mut())?;
        draft
    };

    out.publish()
}
