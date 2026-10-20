use std::borrow::Cow;
use std::path::PathBuf;

/// Recoverable errors retain native status and the affected source or path.
#[derive(Debug, thiserror::Error)]
pub enum LoliError {
    #[error("No WebView2 runtime found")]
    NoRuntime,

    #[error("Strings containing NUL in the middle cannot be used here")]
    NulInMiddle,

    #[error("An absolute path is needed here")]
    NotAbsolute,

    #[error("Cannot load library: {path}")]
    LoadLib {
        path: PathBuf,
        #[source]
        source: windows::core::Error,
    },

    #[error("Did not find symbol: {symbol}")]
    NoSymbol { symbol: Cow<'static, str> },

    #[error("Windows system error: {0}")]
    System(#[from] windows::core::Error),
}
