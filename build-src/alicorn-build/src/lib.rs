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
use util::codegen::Storage;
pub use util::svg::SvgError;

/// Uncompressed resource and its output settings.
#[derive(Debug)]
pub struct Source {
    /// Name of the generated Rust module, source file and data file.
    pub name: String,
    /// XZ compression level captured when the resource was registered.
    pub compression_level: u32,
    /// Uncompressed resource input.
    pub data: SourceData,
    /// Paths Cargo should watch for changes.
    pub dependencies: Vec<PathBuf>,
}

#[derive(Debug)]
pub enum SourceData {
    /// Data supplied by a file.
    File(PathBuf),

    /// Data supplied directly.
    Bytes(Vec<u8>),
}

impl SourceData {
    fn to_data(&self) -> Result<Cow<'_, [u8]>, EmbedError> {
        match self {
            Self::File(fp) => read_file(fp).map(Cow::Owned),
            Self::Bytes(data) => Ok(Cow::Borrowed(data)),
        }
    }
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

    #[error("Resource path is not valid UTF-8: {path}")]
    NonUtf8Path { path: PathBuf },

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
    /// With `debug` enabled, file sources are read from their absolute paths at
    /// runtime, and byte sources are embedded uncompressed. Otherwise, both
    /// source types are embedded with XZ compression.
    ///
    /// Enable `debug` only for builds with debug assertions. Runtime file paths
    /// require the source files to remain available at their build-time
    /// locations (absolute path), making the binary unportable.
    pub fn make_available(
        &self,
        directory: impl AsRef<Path>,
        debug: bool,
    ) -> Result<(), EmbedError> {
        let directory =
            std::path::absolute(directory.as_ref()).map_err(|source| EmbedError::Io {
                path: directory.as_ref().to_owned(),
                source,
            })?;

        std::fs::create_dir_all(&directory).map_err(|source| EmbedError::Io {
            path: directory.to_owned(),
            source,
        })?;
        for path in self.dependencies() {
            println!("cargo:rerun-if-changed={}", path.display());
        }
        self.sources.par_iter().try_for_each(|(name, source)| {
            let output = directory.join(format!("{name}.arc"));
            let code = if debug {
                match &source.data {
                    SourceData::File(path) => {
                        let path =
                            std::fs::canonicalize(path).map_err(|source| EmbedError::Io {
                                path: path.clone(),
                                source,
                            })?;
                        util::codegen::generate(name, Storage::Path(&path))?
                    }
                    SourceData::Bytes(bytes) => {
                        write_file(&output, bytes)?;
                        util::codegen::generate(name, Storage::Raw)?
                    }
                }
            } else {
                let data = source.data.to_data()?;
                let compressed = util::compression::compress(&data, source.compression_level)
                    .map_err(|source| EmbedError::Compression { source })?;
                write_file(&output, &compressed)?;
                util::codegen::generate(name, Storage::Xz {
                    decoded_len: data.len(),
                })?
            };
            write_file(&directory.join(format!("{name}.rs")), code.as_bytes())
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

/// [`std::fs::write`] but throws [`EmbedError`].
fn write_file(path: &Path, data: &[u8]) -> Result<(), EmbedError> {
    std::fs::write(path, data).map_err(|source| EmbedError::Io {
        path: path.to_owned(),
        source,
    })
}
