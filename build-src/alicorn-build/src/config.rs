use std::collections::BTreeMap;

use serde::Deserialize;

use crate::Declaration;

/// Resource declarations and build settings.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildConfig {
    #[serde(default)]
    pub global: GlobalConfig,
    #[serde(default)]
    pub lucide: LucideConfig,

    /// List of embeddings.
    #[serde(default)]
    pub embed: BTreeMap<String, Declaration>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct GlobalConfig {
    pub compression_level: u32,
}

impl Default for GlobalConfig {
    fn default() -> Self {
        Self {
            compression_level: 9,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct LucideConfig {
    pub side: u32,
}

impl Default for LucideConfig {
    fn default() -> Self { Self { side: 64 } }
}
