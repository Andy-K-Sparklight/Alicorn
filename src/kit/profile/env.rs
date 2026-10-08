//! Environment definitions.

use serde::Deserialize;
use serde::Serialize;

/// Operating-system names used in game metadata.
#[derive(Copy, Clone, Eq, PartialEq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OsName {
    Windows,
    Osx,
    Linux,
}
