//! Template string processing.

use std::borrow::Cow;

use memchr::memchr;
use memchr::memmem;

/// Replaces `${key}` placeholders with values returned by `value_supplier`.
///
/// This method assumes that keys won't contain the right brace (and can
/// therefore simplify the lookup).
#[allow(
    clippy::arithmetic_side_effects,
    reason = "Manual bounded index calculation"
)]
pub fn interpret_ts<'a, S, R>(ts: impl Into<Cow<'a, str>>, mut value_supplier: S) -> Cow<'a, str>
where
    S: FnMut(&str) -> Option<R>,
    R: AsRef<str>,
{
    let ts = ts.into();
    let bytes = ts.as_bytes();
    let finder = memmem::Finder::new(b"${");

    let mut search_pos = 0;
    let mut last_end = 0;
    let mut output: Option<String> = None;

    // Indices used in this loop shall not overflow, otherwise there would be near
    // `usize::MAX` bytes in memory — highly impractical.
    while let Some(offset) = finder.find(&bytes[search_pos..]) {
        let pattern_start = search_pos + offset;
        let key_start = pattern_start + 2; // Under the worst case this points one pass the end

        let Some(offset) = memchr(b'}', &bytes[key_start..]) else {
            break; // No ending
        };

        let end = key_start + offset;
        let key = &ts[key_start..end];

        if let Some(value) = value_supplier(key) {
            let out = output.get_or_insert_default();

            out.push_str(&ts[last_end..pattern_start]);
            out.push_str(value.as_ref());

            last_end = end + 1;
        }

        search_pos = end + 1;
    }

    match output {
        Some(mut out) => {
            out.push_str(&ts[last_end..]);
            Cow::Owned(out)
        }
        None => ts,
    }
}

#[cfg(test)]
mod tests {
    use std::rc::Rc;

    use super::*;

    /// Nested-looking keys end at the first brace, leaving later placeholders
    /// available.
    #[test]
    fn interpret_ts_first_brace() {
        let mut keys = Vec::new();
        let output = interpret_ts("${abc${d}}${next}", |key| {
            keys.push(key.to_owned());
            Some(Rc::from("value"))
        });

        assert_eq!(
            keys,
            ["abc${d", "next"],
            "Keys should end at the first brace"
        );
        assert_eq!(output, "value}value", "The trailing brace should remain");
    }

    /// Empty keys and keys containing dollars, braces, Unicode, or newlines are
    /// passed unchanged.
    #[test]
    fn interpret_ts_keys() {
        let mut keys = Vec::new();
        let output = interpret_ts("${}${a$b{c}${世界\né}", |key| {
            keys.push(key.to_owned());
            Some(Rc::from("value"))
        });

        assert_eq!(
            keys,
            ["", "a$b{c", "世界\né"],
            "Keys should contain all characters before the closing brace"
        );
        assert_eq!(
            output, "valuevaluevalue",
            "Each placeholder should be replaced"
        );
    }

    /// Unknown and unclosed placeholders survive replacements of surrounding
    /// known keys.
    #[test]
    fn interpret_ts_preserved_placeholders() {
        let mut keys = Vec::new();
        let output = interpret_ts("${missing${inner}} ${known} ${missing} ${open ${", |key| {
            keys.push(key.to_owned());
            if key == "known" {
                Some(Rc::from("value"))
            } else {
                None
            }
        });

        assert_eq!(
            keys,
            ["missing${inner", "known", "missing"],
            "Only closed placeholders should reach the supplier"
        );
        assert_eq!(
            output, "${missing${inner}} value ${missing} ${open ${",
            "Unknown and unclosed placeholders should remain unchanged"
        );
    }
}
