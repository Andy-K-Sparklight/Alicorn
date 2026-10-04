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
    /// Other hard links to the output retain their contents.
    pub fn publish(self) -> std::io::Result<File> {
        self.tmp.persist(&self.output).map_err(Into::into)
    }
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use super::*;

    /// Dropping an unpublished draft preserves the destination and removes
    /// staged content.
    #[test]
    fn draft_discard() {
        let dir = tempfile::tempdir().expect("Temporary directory should be created");
        let path = dir.path().join("output");
        std::fs::write(&path, b"original").expect("Destination should be written");
        let mut draft = DraftFile::new(&path).expect("Draft should be created");
        draft
            .as_file_mut()
            .write_all(b"partial")
            .expect("Draft should be written");
        drop(draft);
        assert_eq!(
            std::fs::read(&path).expect("Destination should remain readable"),
            b"original",
            "Discarded draft should preserve the destination",
        );
        assert_eq!(
            std::fs::read_dir(dir.path())
                .expect("Temporary directory should remain readable")
                .count(),
            1,
            "Discarded draft should remove its temporary file",
        );
    }

    /// Publishing a draft replaces the destination while preserving existing
    /// hard-link contents.
    #[test]
    fn draft_publish() {
        let dir = tempfile::tempdir().expect("Temporary directory should be created");
        let path = dir.path().join("output");
        let linked = dir.path().join("linked");
        std::fs::write(&path, b"original").expect("Destination should be written");
        std::fs::hard_link(&path, &linked).expect("Destination hard link should be created");
        let mut draft = DraftFile::new(&path).expect("Draft should be created");
        draft
            .as_file_mut()
            .write_all(b"completed")
            .expect("Draft should be written");
        assert_eq!(
            std::fs::read(&path).expect("Destination should remain readable"),
            b"original",
            "Staging should preserve the destination until publication",
        );
        draft.publish().expect("Draft should be published");
        assert_eq!(
            std::fs::read(&path).expect("Published destination should be readable"),
            b"completed",
            "Publication should replace destination content",
        );
        assert_eq!(
            std::fs::read(&linked).expect("Existing hard link should remain readable"),
            b"original",
            "Publication should preserve other hard links",
        );
    }
}
