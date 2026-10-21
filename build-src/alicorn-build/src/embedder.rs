use std::path::Path;
use std::sync::Arc;

use serde::Deserialize;

use crate::EmbedError;
use crate::Source;
use crate::config::GlobalConfig;
use crate::config::LucideConfig;

mod lucide;
mod raw;

pub use lucide::LucideDeclaration;
pub use lucide::LucideEmbedder;
pub use raw::RawDeclaration;
pub use raw::RawEmbedder;

/// General embedder trait.
pub trait Embedder: Sync {
    /// Required declaration type of this embedder.
    type Declaration;

    /// Embeds the given [`Declaration`] and emits the embeddable data.
    fn create_source(
        &self,
        name: String,
        declaration: Self::Declaration,
    ) -> Result<Source, EmbedError>;
}

/// An embed item declaration.
#[derive(Debug, Deserialize)]
#[serde(tag = "by", rename_all = "snake_case", deny_unknown_fields)]
pub enum Declaration {
    Raw(RawDeclaration),
    Lucide(LucideDeclaration),
}

/// Shared context of all embedders.
#[derive(Debug, Clone)]
struct Context {
    root: Arc<Path>,
    global: GlobalConfig,
}

impl Context {
    fn new(root: Arc<Path>) -> Self {
        Self {
            root,
            global: GlobalConfig::default(),
        }
    }
}

/// Embedder registry.
#[derive(Debug, Clone)]
pub struct Embedders {
    raw: RawEmbedder,
    lucide: LucideEmbedder,
}

impl Embedders {
    pub fn new(root: Arc<Path>) -> Self {
        Self {
            raw: RawEmbedder::new(Arc::clone(&root)),
            lucide: LucideEmbedder::new(root),
        }
    }

    /// Configures all embedders using the supplied configurations.
    pub fn configure(
        &mut self,
        global: GlobalConfig,
        lucide: LucideConfig,
    ) -> Result<(), EmbedError> {
        if global.compression_level > 9 {
            return Err(EmbedError::InvalidCompressionLevel {
                level: global.compression_level,
            });
        }
        self.lucide.configure(&global, lucide)?;
        self.raw.configure(&global);
        Ok(())
    }

    /// Creates [`Source`] using [`Declaration`].
    pub fn create_source(
        &self,
        name: String,
        declaration: Declaration,
    ) -> Result<Source, EmbedError> {
        match declaration {
            Declaration::Raw(declaration) => self.raw.create_source(name, declaration),
            Declaration::Lucide(declaration) => self.lucide.create_source(name, declaration),
        }
    }
}
