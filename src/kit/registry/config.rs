use derive_more::with_trait::From;
use serde::Deserialize;
use serde::Serialize;
use serde_evolve::Versioned;

use crate::new_by_default;

/// Main application config.
#[derive(Debug, Default, Clone, Eq, PartialEq, Versioned, From)]
#[versioned(mode = "infallible", chain(ConfigV1), transparent = true)]
pub struct Config(pub ConfigV1);

#[derive(Debug, Default, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct ConfigV1 {
    /// Whether to permit automatic self-updates (default `false`).
    pub self_update: bool,
}

new_by_default!(pub Config);
new_by_default!(pub ConfigV1);

impl From<&Config> for ConfigV1 {
    fn from(value: &Config) -> Self { value.0.clone() }
}
