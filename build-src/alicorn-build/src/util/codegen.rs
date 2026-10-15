use indoc::formatdoc;

use crate::EmbedError;
use crate::Source;

/// Checks that a resource name matches `[a-z_][0-9a-z_]*`.
pub fn validate_name(name: &str) -> Result<(), EmbedError> {
    let valid = matches!(name.as_bytes().first(), Some(b'a'..=b'z' | b'_'))
        && name
            .as_bytes()
            .iter()
            .all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'z' | b'_'));

    if !valid {
        return Err(EmbedError::InvalidName {
            name: name.to_owned(),
        });
    }
    Ok(())
}

/// Generates Rust source and data file for embedding.
pub fn generate(source: &Source, compressed: bool) -> String {
    let name = &source.name;

    let constructor = if compressed {
        format!("new(BYTES, {})", source.data.len())
    } else {
        "new_raw(BYTES)".to_owned()
    };

    formatdoc! {
        r#"
        /// Module containing embedded data of `{name}`.
        #[allow(unused, reason = "Generated code")]
        mod {name} {{
            const BYTES: &[u8] = include_bytes!("{name}.arc");

            /// Embedded data as a constant.
            ///
            /// Note: This is a **value**, meaning that it's copied to the call site.
            /// Make sure you don't accidentally introduce unwanted storage.
            pub const DATA: crate::kit::storage::embed::EmbeddedData<'static> =
                crate::kit::storage::embed::EmbeddedData::{constructor};

            /// Stores the embedded data, which is decoded upon the first access.
            pub static LAZY_DATA: std::sync::LazyLock<std::sync::Arc<[u8]>> =
                std::sync::LazyLock::new(|| DATA.decode().into());
        }}
        "#
    }
}
