#![cfg(windows)]

//! Runs your [`ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler`]
//! using a system-installed or provided WebView2.

mod creation;
mod discovery;
mod error;
mod util;

pub use creation::create_environment;
pub use creation::create_environment_from_path;
pub use error::LoliError;
pub use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler;
pub use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2EnvironmentOptions;
