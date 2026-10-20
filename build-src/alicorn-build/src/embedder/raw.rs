use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

use serde::Deserialize;

use super::Context;
use crate::EmbedError;
use crate::Embedder;
use crate::Source;
use crate::SourceData;
use crate::config::GlobalConfig;
use crate::util::codegen;

/// A file relative to the build root or bytes supplied by the caller.
#[derive(Debug, Deserialize)]
#[serde(untagged, deny_unknown_fields)]
pub enum RawDeclaration {
    File {
        path: PathBuf,
    },

    /// In-memory input available through the Rust API.
    #[serde(skip)]
    Bytes {
        data: Vec<u8>,
    },
}

/// Embeds files and raw binary data using shared build settings.
#[derive(Debug, Clone)]
pub struct RawEmbedder {
    context: Context,
}

impl RawEmbedder {
    /// Creates a loader with default settings and the supplied input root.
    pub fn new(root: impl Into<Arc<Path>>) -> Self {
        Self {
            context: Context::new(root.into()),
        }
    }

    pub(super) fn configure(&mut self, global: &GlobalConfig) {
        global.clone_into(&mut self.context.global);
    }
}

impl Embedder for RawEmbedder {
    type Declaration = RawDeclaration;

    fn create_source(
        &self,
        name: String,
        declaration: RawDeclaration,
    ) -> Result<Source, EmbedError> {
        codegen::validate_name(&name)?;
        let (data, dependencies) = match declaration {
            RawDeclaration::File { path } => {
                let path = self.context.root.join(path);
                (SourceData::File(path.clone()), vec![path])
            }
            RawDeclaration::Bytes { data } => (SourceData::Bytes(data), Vec::new()),
        };
        Ok(Source {
            name,
            compression_level: self.context.global.compression_level,
            data,
            dependencies,
        })
    }
}
