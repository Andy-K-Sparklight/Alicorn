//! Maven library coordinates.

use std::borrow::Cow;
use std::fmt::Debug;
use std::fmt::Display;
use std::fmt::Formatter;
use std::fmt::Write;

use thiserror::Error;

use crate::util::scoped::TheScoped;
use crate::write_strs;

/// A parsed maven name view of the library name.
pub struct MavenName<'a> {
    pub group: &'a str,
    pub artifact: &'a str,
    pub version: &'a str,
    pub classifier: Option<&'a str>,
    pub extension: &'a str,
}

/// A Maven name is missing a required coordinate.
#[derive(Debug, Error)]
#[error("Invalid Maven library name: {name}")]
pub struct MavenNameError {
    pub name: String,
}

impl Debug for MavenName<'_> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result { Display::fmt(self, f) }
}

impl Display for MavenName<'_> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write_strs!(f; self.group, ":", self.artifact, ":", self.version)?;
        if let Some(c) = self.classifier {
            write_strs!(f; ":", c)?;
        }

        if self.extension != "jar" {
            write_strs!(f; "@", self.extension)?;
        }

        Ok(())
    }
}

impl<'a> MavenName<'a> {
    /// Parses `group:artifact:version[:classifier][@extension]`, defaulting the
    /// extension to `jar`.
    ///
    /// Upon missing coordinates, [`MavenNameError`] is raised.
    pub fn parse(name: &'a str) -> Result<Self, MavenNameError> {
        let (base, ext) = match name.split_once("@") {
            Some((left, right)) => (left, right),
            None => (name, ""),
        };

        let mut coordinates = base.split(':');
        let group = coordinates.next().unwrap_or_default();
        let artifact = coordinates.next().unwrap_or_default();
        let version = coordinates.next().unwrap_or_default();

        if group.is_empty() || artifact.is_empty() || version.is_empty() {
            return Err(MavenNameError {
                name: name.to_owned(),
            });
        }

        let classifier = coordinates.next().filter(|value| !value.is_empty());
        let extension = if ext.is_empty() { "jar" } else { ext };

        Ok(Self {
            group,
            artifact,
            version,
            classifier,
            extension,
        })
    }

    /// Collected version of [`Self::fmt_url_path`].
    #[must_use]
    pub fn to_url_path(&self) -> String {
        String::new().apply(|it| {
            self.fmt_url_path(it)
                .expect("Formatting into a String should not fail");
        })
    }

    /// Formats an escaped, URL-valid path denoted by this Maven name, into the
    /// given [`Write`].
    ///
    /// This is done by encoding each path component, then join them as per
    /// Maven specification. In particular, consecutive dots `..` are preserved
    /// as-is for e.g. artifact names. As this is already the best we can do,
    /// it's up to the service to correctly handle them.
    pub fn fmt_url_path(&self, writer: &mut impl Write) -> core::fmt::Result {
        for (index, component) in self.to_path_components().enumerate() {
            if index != 0 {
                writer.write_char('/')?;
            }
            writer.write_str(&urlencoding::encode(&component))?;
        }

        Ok(())
    }

    /// Produces an iterator which iterates over the path components produced by
    /// this Maven name.
    ///
    /// Joining these components should produce the location of this file but
    /// with one caveat: This method does no escaping, therefore directly
    /// joining these components bears the risk of misinterpretation.
    pub fn to_path_components(&self) -> impl Iterator<Item = Cow<'_, str>> {
        self.group
            .split('.')
            .chain([self.artifact, self.version])
            .map(Cow::Borrowed)
            .chain(core::iter::once(Cow::Owned(self.make_filename())))
    }

    /// Collected version of [`Self::fmt_filename`].
    #[must_use]
    pub fn make_filename(&self) -> String {
        String::new().apply(|it| {
            self.fmt_filename(it)
                .expect("Formatting into String should succeed");
        })
    }

    /// Formats the filename into a [`core::fmt::Write`].
    pub fn fmt_filename(&self, writer: &mut impl Write) -> core::fmt::Result {
        write_strs!(writer; self.artifact, "-", self.version)?;

        if let Some(classifier) = self.classifier {
            write_strs!(writer; "-", classifier)?;
        }

        write_strs!(writer; ".", self.extension)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Checks that Maven name displays correctly.
    #[test]
    fn maven_name_display() {
        for (src, dst) in [
            ("a:b:c@d", "a:b:c@d"),
            ("a:b:c@jar", "a:b:c"),
            ("a:b:c:d", "a:b:c:d"),
        ] {
            let exp = MavenName::parse(src).expect("Valid names should be parsed");

            assert_eq!(exp.to_string(), dst, "Names should be formatted correctly");
        }
    }

    /// Raw components retain repository order, classifiers, extensions, and
    /// permissive trailing coordinates.
    #[test]
    fn maven_path_components() -> Result<(), MavenNameError> {
        for (name, filename) in [
            ("org.example:lib:1", "lib-1.jar"),
            ("org.example:lib:1:@", "lib-1.jar"),
            ("org.example:lib:1:native@zip", "lib-1-native.zip"),
            (
                "org.example:lib:1:native:ignore@zip@wow",
                "lib-1-native.zip@wow",
            ),
        ] {
            let name = MavenName::parse(name)?;
            assert_eq!(
                name.to_path_components().collect::<Vec<_>>(),
                ["org", "example", "lib", "1", filename],
                "Components should follow the Maven repository hierarchy"
            );
        }
        Ok(())
    }

    /// URL encoding preserves raw component boundaries, empty segments, dot
    /// segments, Unicode, and characters with URL syntax meanings.
    #[test]
    fn maven_url_components() {
        let name = MavenName {
            group: "org..🈲",
            artifact: "a/b\\?#%",
            version: "..",
            classifier: Some("native/"),
            extension: "jar",
        };
        assert_eq!(
            name.to_path_components().collect::<Vec<_>>(),
            ["org", "", "🈲", "a/b\\?#%", "..", "a/b\\?#%-..-native/.jar"],
            "Raw components should be retained as-is"
        );
        assert_eq!(
            name.to_url_path(),
            "org//%F0%9F%88%B2/a%2Fb%5C%3F%23%25/../a%2Fb%5C%3F%23%25-..-native%2F.jar",
            "URL components should be encoded"
        );
        let name = MavenName::parse("org:lib:1+meta").expect("Fixture should parse");
        assert_eq!(
            name.to_url_path(),
            "org/lib/1%2Bmeta/lib-1%2Bmeta.jar",
            "Version metadata should use percent encoding"
        );
    }

    /// Parsing rejects missing group, artifact, or version coordinates.
    #[test]
    fn maven_parse_missing() {
        for name in [
            "",
            "group:artifact",
            ":artifact:1",
            "group::1",
            "group:artifact:",
        ] {
            assert!(
                MavenName::parse(name).is_err(),
                "Missing coordinates should fail"
            );
        }
    }
}
