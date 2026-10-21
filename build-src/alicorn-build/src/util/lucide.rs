//! Reads SVGs from the installed Lucide static package.

use std::path::Path;
use std::path::PathBuf;

use crate::EmbedError;

/// Loads a named SVG icon from `node_modules/lucide-static/icons`. Returns its
/// path together with the content.
pub fn read_icon(root: &Path, name: &str) -> Result<(PathBuf, Vec<u8>), EmbedError> {
    let path = root
        .join("node_modules/lucide-static/icons")
        .join(format!("{name}.svg"));
    let bytes = crate::read_file(&path)?;
    Ok((path, bytes))
}
