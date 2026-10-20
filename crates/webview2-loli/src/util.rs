use std::path::Path;

use windows::core::HSTRING;

use crate::LoliError;

/// Encodes `path` as [`HSTRING`] if it's absolute and contains no NUL in the
/// middle.
pub fn encode_absolute_path(path: &Path) -> Result<HSTRING, LoliError> {
    if !path.is_absolute() {
        return Err(LoliError::NotAbsolute);
    }

    let p = HSTRING::from(path);
    if p.contains(&0) {
        return Err(LoliError::NulInMiddle);
    }

    Ok(p)
}
