use std::path::Path;
use std::sync::Arc;

use serde::Deserialize;

use super::Context;
use crate::EmbedError;
use crate::Embedder;
use crate::Source;
use crate::config::GlobalConfig;
use crate::config::LucideConfig;
use crate::util::codegen;
use crate::util::svg;

/// The name of an icon in the Lucide static package.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LucideDeclaration {
    pub name: String,
}

/// Renders Lucide icons into square alpha masks using shared loader settings.
#[derive(Debug, Clone)]
pub struct LucideEmbedder {
    context: Context,
    config: LucideConfig,
}

impl LucideEmbedder {
    /// Creates a loader with default settings and the supplied input root.
    pub fn new(root: impl Into<Arc<Path>>) -> Self {
        Self {
            context: Context::new(root.into()),
            config: LucideConfig::default(),
        }
    }

    /// Updates the global and Lucide settings used for subsequent declarations.
    pub(super) fn configure(
        &mut self,
        global: &GlobalConfig,
        config: LucideConfig,
    ) -> Result<(), EmbedError> {
        self.config = config;
        global.clone_into(&mut self.context.global);
        Ok(())
    }
}

impl Embedder for LucideEmbedder {
    type Declaration = LucideDeclaration;

    fn create_source(
        &self,
        name: String,
        declaration: LucideDeclaration,
    ) -> Result<Source, EmbedError> {
        codegen::validate_name(&name)?;
        let (path, svg) = crate::util::lucide::read_icon(&self.context.root, &declaration.name)?;
        let data = svg::render(&svg, self.config.side).map_err(|source| EmbedError::Svg {
            name: name.clone(),
            source,
        })?;
        Ok(Source {
            name,
            compression_level: self.context.global.compression_level,
            data,
            dependencies: vec![path],
        })
    }
}
