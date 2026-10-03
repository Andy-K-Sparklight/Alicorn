//! Environment definitions.

use serde::Deserialize;
use serde::Serialize;

/// Operating-system names used in game metadata.
#[derive(PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OsName {
    Windows,
    Osx,
    Linux,
}
