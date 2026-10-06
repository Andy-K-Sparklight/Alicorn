//! Native library classifiers and artifacts.

use std::borrow::Cow;

use super::env::OsName;
use super::version::Library;
use super::version::LibraryArt;

/// Platform bitwidth that's used to interpret classifiers.
#[derive(Copy, Clone)]
pub enum OsBits {
    Bits32,
    Bits64,
}

// TODO: Converting from platform architecture?

impl OsBits {
    /// Gets the string value for interpolation.
    pub const fn as_value(&self) -> &'static str {
        match self {
            Self::Bits32 => "32",
            Self::Bits64 => "64",
        }
    }
}

/// Interprets the classifier name.
///
/// According to values observed in 1.7.x, classifier names in the `natives` map
/// accepts interpolation strings. Currently only `${arch}` is observed, which
/// is set to 32 or 64 according to system bits version.
pub fn interpret_classifier<'a>(name: impl Into<Cow<'a, str>>, bits: OsBits) -> Cow<'a, str> {
    const ARCH_MATCHER: &str = "${arch}";

    let mut name = name.into();

    #[expect(
        clippy::arithmetic_side_effects,
        reason = "String size cannot practically overflow"
    )]
    while let Some(pos) = name.find(ARCH_MATCHER) {
        name.to_mut()
            .replace_range(pos..pos + ARCH_MATCHER.len(), bits.as_value());
    }

    name
}

impl Library {
    /// Selects a classifier from [`Self::natives`] for the supplied [`OsName`]
    /// and [`OsBits`], with the name interpolated.
    pub fn select_classifier(&self, os: OsName, bits: OsBits) -> Option<Cow<'_, str>> {
        let classifier = self.natives.as_ref()?.get(&os)?;
        Some(interpret_classifier(classifier.as_str(), bits))
    }

    /// Selects a classifier via [`Self::select_classifier`], then selects the
    /// corresponding artifact.
    pub fn select_classified_artifact(&self, os: OsName, bits: OsBits) -> Option<&LibraryArt> {
        let classifier = self.select_classifier(os, bits)?;

        self.downloads
            .as_ref()?
            .classifiers
            .as_ref()?
            .get(&*classifier)
    }
}

#[cfg(test)]
mod tests {
    use std::assert_matches;

    use serde_json::json;

    use super::*;

    /// Native selection substitutes both widths, borrows unchanged names, and
    /// selects empty keys while tolerating missing declarations or downloads.
    #[test]
    fn natives_selection() -> Result<(), serde_json::Error> {
        let library: Library = serde_json::from_value(json!({
            "name": "org.example:lib:1",
            "natives": {"linux": "native-${arch}-${arch}", "windows": "native-${other}"},
            "downloads": {"classifiers": {
                "native-64-64": {"sha1": "hash", "size": 1, "url": "native"},
                "": {"sha1": "hash", "size": 1, "url": "empty-classifier"}
            }}
        }))?;

        assert_matches!(
            library.select_classifier(OsName::Linux, OsBits::Bits32),
            Some(value) if value == "native-32-32",
            "Natives should be selected and interpolated"
        );

        assert!(
            library
                .select_classifier(OsName::Osx, OsBits::Bits32)
                .is_none(),
            "Missing OS natives should be absent"
        );

        library
            .select_classified_artifact(OsName::Linux, OsBits::Bits64)
            .expect("An existing classifier should select its artifact");

        assert!(
            library
                .select_classified_artifact(OsName::Linux, OsBits::Bits32)
                .is_none(),
            "A missing classifier should return no artifact"
        );

        assert_matches!(
            library.select_classifier(OsName::Windows, OsBits::Bits32),
            Some(value) if value == "native-${other}",
            "Unrecognized interpolation keys should be retained"
        );

        Ok(())
    }
}
