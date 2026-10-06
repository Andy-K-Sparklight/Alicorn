//! Conditional profile rules.

use std::collections::HashSet;

use regex_lite::Regex;

use super::env::OsName;
use super::version::Rule;
use super::version::RuleAct;

/// Environment used to match profile rules.
///
/// Values should be aligned with the corresponding JVM properties and written
/// in the Mojang form. For example, when targeting a JVM compiled for `i686`
/// Cygwin but runs on ARM Windows, `os` should be `"linux"` and `arch` should
/// be `"x86"`.
pub struct RuleEnv<'a> {
    pub os: OsName,
    pub release: &'a str,
    pub arch: &'a str,
    pub features: &'a HashSet<String>,
}

impl RuleEnv<'_> {
    /// Checks whether the given [`Rule`] is satisfied by this environment.
    pub fn can_satisfy(&self, rule: &Rule) -> bool {
        if let Some(os) = &rule.os {
            if os.name.is_some_and(|it| it != self.os) {
                return false;
            }

            if os.arch.as_ref().is_some_and(|it| it != self.arch) {
                return false;
            }

            if let Some(pattern) = os.version.as_ref() {
                let Ok(r) = Regex::new(pattern) else {
                    return false; // Invalid regex can't match anything
                };

                if !r.is_match(self.release) {
                    return false;
                }
            }
        }

        if let Some(features) = rule.features.as_ref()
            && features
                .iter()
                .any(|(name, required)| self.features.contains(name) != *required)
        {
            return false;
        }

        true
    }

    /// Returns the evaluated action of the given [`Rule`] array against this
    /// environment.
    ///
    /// According to the observed profiles, the last matched rule takes
    /// precedence using its own action (ignoring previous matches). When none
    /// is matched, the action defaults to [`RuleAct::Disallow`].
    pub fn justify(&self, rules: &[Rule]) -> RuleAct {
        rules
            .iter()
            .rev()
            .find(|it| self.can_satisfy(it))
            .map(|it| it.action)
            .unwrap_or(RuleAct::Disallow)
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    /// Ordered rules use the last match, reject empty or unmatched lists, and
    /// treat absent features as false.
    #[test]
    fn rules_order_features() {
        let features = HashSet::new();
        let env = RuleEnv {
            os: OsName::Linux,
            release: "6.1",
            arch: "x64",
            features: &features,
        };
        let rules: Vec<Rule> = serde_json::from_value(json!([
            {"action": "allow"},
            {"action": "disallow", "features": {"demo": false}},
            {"action": "allow", "features": {"demo": true}}
        ]))
        .expect("Rule fixtures should deserialize");
        assert!(!env.justify(&[]).into_bool(), "Empty rules should disallow");
        assert!(
            env.can_satisfy(&rules[1]),
            "A disallow action should leave condition matching unchanged"
        );
        assert!(
            !env.justify(&rules).into_bool(),
            "The last matching false feature rule should disallow"
        );
        assert!(
            !env.justify(&rules[2..]).into_bool(),
            "Unmatched nonempty rules should disallow"
        );
        let features = HashSet::from(["demo".into()]);
        let env = RuleEnv {
            features: &features,
            ..env
        };
        assert!(
            env.justify(&rules).into_bool(),
            "The last matching true feature rule should allow"
        );
    }

    /// OS conditions match together, while invalid release patterns match
    /// nothing and leave earlier matching actions effective.
    #[test]
    fn rules_release_regex() {
        let features = HashSet::new();
        let env = RuleEnv {
            os: OsName::Linux,
            release: "6.1",
            arch: "x64",
            features: &features,
        };
        for (os, expected, msg) in [
            (
                json!({"name": "linux", "version": "^6\\.", "arch": "x64"}),
                true,
                "Valid matchers should match",
            ),
            (
                json!({"name": "windows"}),
                false,
                "OS names should be distinguished",
            ),
            (
                json!({"version": "^5\\."}),
                false,
                "OS versions should be distinguished",
            ),
            (
                json!({"arch": "x.*"}),
                false,
                "Arch matchers should not be matched as regex",
            ),
            (
                json!({"version": "", "arch": ""}),
                false,
                "Empty matchers should not match non-empty values",
            ),
        ] {
            let rule = serde_json::from_value(json!({"action": "allow", "os": os}))
                .expect("Rule fixture should deserialize");

            assert_eq!(env.can_satisfy(&rule), expected, "{msg}");
        }
        for pattern in ["[", "(?=6)", r"\p{Number}"] {
            let mut rules: Vec<Rule> = serde_json::from_value(json!([
                {"action": "allow"},
                {"action": "disallow", "os": {"version": pattern}}
            ]))
            .expect("Rule fixtures should deserialize");
            assert!(
                !env.can_satisfy(&rules[1]),
                "Invalid release patterns should never match"
            );
            assert!(
                env.justify(&rules).into_bool(),
                "An earlier matching allow should remain effective"
            );
            rules[0].action = RuleAct::Disallow;
            rules[1].action = RuleAct::Allow;
            assert!(
                !env.justify(&rules).into_bool(),
                "An invalid allow pattern should leave an earlier disallow effective"
            );
            assert!(
                !env.justify(&rules[1..]).into_bool(),
                "A list containing only an invalid pattern should disallow"
            );
        }
    }

    /// Release rules use regex-lite's ASCII classes and case folding while
    /// retaining literal Unicode matching.
    #[test]
    fn rules_release_regex_lite() {
        let features = HashSet::new();
        for (release, pattern, expected) in [
            ("6.1", r"^\d+\.\d+$", true),
            ("٦.١", r"^\d+\.\d+$", false),
            ("é", "^é$", true),
            ("É", "(?i)^é$", false),
            ("LINUX", "(?i)^linux$", true),
        ] {
            let env = RuleEnv {
                os: OsName::Linux,
                release,
                arch: "x64",
                features: &features,
            };
            let rule = serde_json::from_value(json!({
                "action": "allow",
                "os": {"version": pattern}
            }))
            .expect("Rule fixture should deserialize");
            assert_eq!(
                env.can_satisfy(&rule),
                expected,
                "Release matching should follow regex-lite semantics"
            );
        }
    }
}
