//! Alicorn build tools.
//!
//! This module can generate necessary content at compile time

use std::borrow::Cow;
use std::collections::BTreeMap;
use std::collections::BTreeSet;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

use rayon::prelude::*;

mod config;
mod embedder;
mod util;

use config::BuildConfig;
pub use embedder::Declaration;
pub use embedder::Embedder;
use embedder::Embedders;
pub use embedder::LucideDeclaration;
pub use embedder::LucideEmbedder;
pub use embedder::RawDeclaration;
pub use embedder::RawEmbedder;
pub use util::svg::SvgError;

/// Uncompressed resource and its output settings.
#[derive(Debug)]
pub struct Source {
    /// Name of the generated Rust module, source file and data file.
    pub name: String,
    /// XZ compression level captured when the resource was registered.
    pub compression_level: u32,
    /// Uncompressed data content.
    pub data: Vec<u8>,
    /// Paths Cargo should watch for changes.
    pub dependencies: Vec<PathBuf>,
}

/// Build options passed to [`AlicornBuild`].
#[derive(Debug)]
pub struct BuildOptions {
    /// Project directory.
    pub root: PathBuf,
}

#[derive(Debug, thiserror::Error)]
pub enum EmbedError {
    #[error("Could not access {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("Could not parse {path}: {source}")]
    Config {
        path: PathBuf,
        #[source]
        source: toml::de::Error,
    },

    #[error("Invalid resource name {name:?}")]
    InvalidName { name: String },

    #[error("Resource {name:?} is already registered")]
    DuplicateName { name: String },

    #[error("XZ compression level {level} is outside 0..=9")]
    InvalidCompressionLevel { level: u32 },

    #[error("Could not render SVG for {name:?}: {source}")]
    Svg {
        name: String,
        #[source]
        source: SvgError,
    },

    #[error("Could not compress embedded data: {source}")]
    Compression {
        #[source]
        source: std::io::Error,
    },
}

/// Main build handle.
#[derive(Debug)]
pub struct AlicornBuild {
    root: Arc<Path>,
    embedders: Embedders,
    sources: BTreeMap<String, Source>,
    dependencies: BTreeSet<PathBuf>,
}

impl AlicornBuild {
    pub fn new(options: BuildOptions) -> Self {
        let root: Arc<Path> = options.root.into();
        Self {
            embedders: Embedders::new(Arc::clone(&root)),
            root,
            sources: BTreeMap::new(),
            dependencies: BTreeSet::new(),
        }
    }

    /// Adds a resource for embedding.
    pub fn embed(
        &mut self,
        name: impl Into<String>,
        declaration: Declaration,
    ) -> Result<(), EmbedError> {
        let name = name.into();
        let source = self.embedders.create_source(name, declaration)?;
        self.add_source(source);
        Ok(())
    }

    /// Loads and applies the configuration from the given path.
    ///
    /// This method may be called multiple times, affecting subsequently added
    /// items.
    pub fn use_config_file(&mut self, file: impl AsRef<Path>) -> Result<(), EmbedError> {
        let file = self.root.join(file);
        let text = std::fs::read_to_string(&file).map_err(|source| EmbedError::Io {
            path: file.clone(),
            source,
        })?;
        let config: BuildConfig = toml::from_str(&text).map_err(|source| EmbedError::Config {
            path: file.clone(),
            source,
        })?;
        self.embedders.configure(config.global, config.lucide)?;

        let sources = config
            .embed
            .into_par_iter()
            .map(|(name, declaration)| self.embedders.create_source(name, declaration))
            .collect::<Result<Vec<_>, EmbedError>>()?;

        self.dependencies.insert(file);

        for source in sources {
            self.add_source(source);
        }
        Ok(())
    }

    /// Returns the deduplicated Cargo input dependencies in path order.
    pub fn dependencies(&self) -> impl Iterator<Item = &Path> {
        self.dependencies.iter().map(PathBuf::as_path)
    }

    /// Writes embedded resources and Rust modules, and registers their Cargo
    /// dependencies.
    ///
    /// When `debug` is true, all resources are written uncompressed. Otherwise,
    /// each resource uses the compression level captured when it was
    /// registered. Stored resources remain unchanged, so each call can
    /// choose its own output mode.
    pub fn make_available(
        &self,
        directory: impl AsRef<Path>,
        compressed: bool,
    ) -> Result<(), EmbedError> {
        let directory = directory.as_ref();
        std::fs::create_dir_all(directory).map_err(|source| EmbedError::Io {
            path: directory.to_owned(),
            source,
        })?;
        for path in self.dependencies() {
            println!("cargo:rerun-if-changed={}", path.display());
        }
        self.sources.par_iter().try_for_each(|(name, source)| {
            let data = if compressed {
                Cow::Owned(
                    util::compression::compress(&source.data, source.compression_level)
                        .map_err(|source| EmbedError::Compression { source })?,
                )
            } else {
                Cow::Borrowed(source.data.as_slice())
            };
            let code = util::codegen::generate(source, compressed);
            for (ext, bytes) in [("arc", &*data), ("rs", code.as_bytes())] {
                let path = directory.join(format!("{name}.{ext}"));
                std::fs::write(&path, bytes).map_err(|source| EmbedError::Io { path, source })?;
            }
            Ok(())
        })
    }

    /// Records a generated source and its input dependencies.
    fn add_source(&mut self, source: Source) {
        self.dependencies
            .extend(source.dependencies.iter().cloned());
        self.sources.insert(source.name.clone(), source);
    }
}

/// [`std::fs::read`] but throws [`EmbedError`].
fn read_file(path: &Path) -> Result<Vec<u8>, EmbedError> {
    std::fs::read(path).map_err(|source| EmbedError::Io {
        path: path.to_owned(),
        source,
    })
}
