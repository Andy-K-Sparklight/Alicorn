use std::path::Path;

use indoc::formatdoc;

use crate::EmbedError;

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

/// Selects how a generated module loads its resource.
pub enum Storage<'a> {
    /// Reads the given path at runtime.
    Path(&'a Path),

    /// Includes uncompressed bytes from the resource's `.arc` file.
    Raw,

    /// Includes XZ-compressed bytes from the resource's `.arc` file.
    Xz { decoded_len: usize },
}

/// Generates a resource module using the selected storage format.
pub fn generate(name: &str, storage: Storage<'_>) -> Result<String, EmbedError> {
    let constructor = match storage {
        Storage::Path(path) => {
            let path = path.to_str().ok_or_else(|| EmbedError::NonUtf8Path {
                path: path.to_owned(),
            })?;
            format!("by_path(\"{}\".as_bytes())", path.escape_default())
        }
        Storage::Raw => format!(
            "new_raw(include_bytes!(\"{}\"))",
            format!("{name}.arc").escape_default()
        ),
        Storage::Xz { decoded_len } => format!(
            "new(include_bytes!(\"{}\"), {decoded_len})",
            format!("{name}.arc").escape_default()
        ),
    };

    Ok(formatdoc! {
        r#"
        /// Module containing embedded data of `{name}`.
        #[allow(unused, reason = "Generated code")]
        mod {name} {{
            /// Embedded data as a constant.
            ///
            /// Note: This is a **value**, meaning that it's copied to the call site.
            /// Make sure you don't accidentally introduce unwanted storage.
            pub const DATA: crate::kit::storage::embed::EmbeddedData<'static> =
                crate::kit::storage::embed::EmbeddedData::{constructor};

            /// Stores the resource, which is loaded upon the first access.
            pub static LAZY_DATA: std::sync::LazyLock<std::sync::Arc<[u8]>> =
                std::sync::LazyLock::new(|| DATA.decode().into());
        }}
        "#
    })
}
