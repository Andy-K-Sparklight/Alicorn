//! Filesystem staging and publication.

use std::fs::File;
use std::path::Path;
use std::path::PathBuf;

use tempfile::NamedTempFile;

/// Tries to create the prefix directory of `dst`, if it's missing.
///
/// This method is a wrapper of [`std::fs::create_dir_all`], and in particular
/// is not guaranteed to be side-effect-free.
pub fn ensure_prefix(dst: &Path) -> std::io::Result<()> {
    if let Some(p) = dst.parent()
        && !p.is_empty()
    {
        std::fs::create_dir_all(p)?;
    }

    Ok(())
}

/// A private draft file which stages content before publishing.
///
/// This is usually the correct item to use when outputting files using
/// non-atomic or fallible operations. You can first mess with all the changes
/// in the draft file, then publish them atomically to the destination once
/// completed, or discard the temporary result upon failure without fearing
/// half-written files, interleaved lines, etc.
pub struct DraftFile {
    output: PathBuf,
    tmp: NamedTempFile,
}

impl DraftFile {
    /// Creates a draft file which will be published to `output`.
    pub fn new(output: impl Into<PathBuf>) -> std::io::Result<Self> {
        let output = output.into();
        let parent = match output.parent() {
            Some(p) if !p.is_empty() => {
                std::fs::create_dir_all(p)?;
                p
            }
            _ => Path::new("."),
        };

        let tmp = NamedTempFile::new_in(parent)?;

        Ok(Self { output, tmp })
    }

    delegate::delegate! {
        to self.tmp {
            pub fn as_file(&self) -> &File;
            pub fn as_file_mut(&mut self) -> &mut File;
        }
    }

    /// Publishes the draft file by replacing its output file. Returns the
    /// underlying file handle. Upon failure, the draft file is discarded.
    pub fn publish(self) -> std::io::Result<File> {
        self.tmp.persist(&self.output).map_err(Into::into)
    }
}
