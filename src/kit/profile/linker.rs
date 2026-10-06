use std::collections::BTreeMap;
use std::rc::Rc;

use serde_json::json;
use thiserror::Error;

/// Loads raw profile documents by ID.
pub trait ProfileSource {
    type Err;

    fn load(&mut self, id: &str) -> Result<serde_json::Value, Self::Err>;
}

/// A failure while resolving raw profile inheritance.
#[derive(Debug, Error)]
pub enum LinkError<E> {
    /// The requested profile has cyclic inheritance.
    #[error("Unsatisfied link when resolving {id}")]
    Unsatisfied { id: String },

    /// Loading the given lookup ID failed.
    #[error("Failed to load profile: {id}")]
    Loader {
        id: String,
        #[source]
        source: E,
    },
}

/// A merged profile and its resolved base lookup ID.
#[derive(Debug, Clone)]
pub struct LinkedProfile {
    /// The merged document with `inheritsFrom` removed.
    pub value: serde_json::Value,
    /// The last lookup ID loaded in the inheritance chain.
    pub base_id: String,
}

/// A loaded body with its inheritance target stored separately.
#[derive(Clone)]
struct LoadedProfile {
    id: Rc<String>,
    value: serde_json::Value,
    parent: Option<Rc<String>>,
}

impl LoadedProfile {
    /// Extracts `inheritsFrom` from `src` as the parent, and retain the rest as
    /// the value.
    fn new(id: Rc<String>, mut value: serde_json::Value) -> Self {
        let parent = match &mut value {
            serde_json::Value::Object(object) => {
                let maybe_parent = object.remove("inheritsFrom");
                match maybe_parent {
                    Some(serde_json::Value::String(id)) => Some(Rc::new(id)),
                    _ => None,
                }
            }
            _ => None,
        };
        Self { id, value, parent }
    }
}

/// Links the profiles denoted by the specified IDs, loading required ones from
/// `source`.
///
/// Returns a map from profile ID to the result: either a [`LinkedProfile`] for
/// a successful load, or a [`LinkError`] describing the problem.
///
/// Intermediate results may be cached for performance, and the exact cache
/// behavior is unspecified.
///
/// Inheritance is *root-to-head*, that is, the root is first patched with its
/// direct dependent, then the dependent of the patched profile, and so on. This
/// is to ensure that intermediate overrides (like a `null` in the middle)
/// correctly blocks data from being inherited. Regardless, the exact
/// inheritance rules are based on guesses and might change in the future.
pub fn link_profile_content<S: ProfileSource>(
    ids: impl Iterator<Item = impl Into<String>>,
    source: &mut S,
) -> BTreeMap<String, Result<LinkedProfile, LinkError<S::Err>>>
where
    S::Err: Clone,
{
    let mut linked_profiles = BTreeMap::<_, Result<LinkedProfile, _>>::new();
    let mut loader_cache = BTreeMap::new();

    for id in ids {
        let id = Rc::new(id.into());
        if linked_profiles.contains_key(&id) {
            continue;
        }

        let mut current = Rc::clone(&id);
        let mut chain: Vec<LoadedProfile> = Vec::new();

        let out = loop {
            if let Some(Ok(profile)) = linked_profiles.get(&current) {
                break Ok(profile.clone());
            }

            if chain.iter().any(|it| it.id == current) {
                // Cyclic
                break Err(LinkError::Unsatisfied {
                    id: (*id).to_owned(),
                });
            }

            let cached = loader_cache.entry(Rc::clone(&current)).or_insert_with(|| {
                source
                    .load(&current)
                    .map(|it| LoadedProfile::new(Rc::clone(&current), it))
                    .map_err(Rc::new)
            });

            let cached = match cached {
                Ok(profile) => profile,
                Err(ex) => {
                    break Err(LinkError::Loader {
                        id: (*current).to_owned(),
                        source: Rc::clone(ex),
                    });
                }
            };

            chain.push(cached.to_owned());

            let Some(parent) = &cached.parent else {
                break Ok(LinkedProfile {
                    value: json!({}),
                    base_id: (*current).to_owned(),
                });
            };

            current = Rc::clone(parent);
        };

        let out = out.map(|root| {
            let base_id = root.base_id;
            let mut v = root.value;
            for c in chain.into_iter().rev() {
                v = merge_json(v, c.value);
            }
            LinkedProfile { value: v, base_id }
        });

        linked_profiles.insert(id, out);
    }

    drop(loader_cache);

    linked_profiles
        .into_iter()
        .map(|(id, result)| {
            // Make errors owned
            let result = result.map_err(|error| match error {
                LinkError::Unsatisfied { id } => LinkError::Unsatisfied { id },
                LinkError::Loader { id, source } => LinkError::Loader {
                    id,
                    source: Rc::unwrap_or_clone(source),
                },
            });
            (Rc::unwrap_or_clone(id), result)
        })
        .collect()
}

/// Patches `base` recursively using `head`, replacing primitive values,
/// extending objects, and prepending arrays.
#[must_use = "Merging does not happen in-place"]
fn merge_json(base: serde_json::Value, head: serde_json::Value) -> serde_json::Value {
    match (base, head) {
        (serde_json::Value::Object(mut base), serde_json::Value::Object(head)) => {
            for (k, v) in head {
                let base_value = base.remove(&k);
                let new_value = match base_value {
                    Some(b) => merge_json(b, v),
                    None => v,
                };
                base.insert(k, new_value);
            }

            serde_json::Value::Object(base)
        }
        (serde_json::Value::Array(base), serde_json::Value::Array(mut head)) => {
            head.extend(base);
            serde_json::Value::Array(head)
        }
        (_, head) => head,
    }
}

#[cfg(test)]
mod tests {
    use core::assert_matches;

    use serde_json::json;

    use super::*;

    #[derive(Debug, Clone, Error)]
    #[error("Profile is missing")]
    struct Missing;

    struct Source {
        profiles: BTreeMap<&'static str, serde_json::Value>,
        loaded: Vec<String>,
    }

    impl Source {
        fn new(profiles: impl IntoIterator<Item = (&'static str, serde_json::Value)>) -> Self {
            Self {
                profiles: profiles.into_iter().collect(),
                loaded: Vec::new(),
            }
        }
    }

    impl ProfileSource for Source {
        type Err = Missing;

        fn load(&mut self, id: &str) -> Result<serde_json::Value, Self::Err> {
            self.loaded.push(id.to_owned());
            self.profiles.get(id).cloned().ok_or(Missing)
        }
    }

    /// Returns the successful result of a test profile's resolution.
    fn linked(result: &Result<LinkedProfile, LinkError<Missing>>) -> &LinkedProfile {
        result.as_ref().expect("The requested profile should link")
    }

    /// Shared ancestors and completed parents preserve merge precedence without
    /// reloading profiles or leaking one child's overrides into another.
    #[test]
    fn link_raw_profiles_inheritance() {
        for ids in [["child", "sibling", "parent", "child"], [
            "parent", "child", "sibling", "parent",
        ]] {
            let mut source = Source::new([
                (
                    "child",
                    json!({
                        "id": "child-metadata",
                        "inheritsFrom": "parent",
                        "version": "child-version",
                        "items": ["child"],
                        "nested": {"b": 2}
                    }),
                ),
                (
                    "parent",
                    json!({
                        "id": "parent-metadata",
                        "inheritsFrom": "base",
                        "version": "parent-version",
                        "items": ["parent"],
                        "nested": null
                    }),
                ),
                (
                    "base",
                    json!({
                        "id": "base-metadata",
                        "version": "base-version",
                        "items": ["base"],
                        "nested": {"a": 1}
                    }),
                ),
                (
                    "sibling",
                    json!({"inheritsFrom": "parent", "items": ["sibling"]}),
                ),
            ]);
            let profiles = link_profile_content(ids.into_iter(), &mut source);
            assert_eq!(
                profiles.len(),
                3,
                "Only distinct requested profiles should be returned"
            );
            assert_eq!(
                linked(&profiles["child"]).value,
                json!({
                    "id": "child-metadata",
                    "version": "child-version",
                    "items": ["child", "parent", "base"],
                    "nested": {"b": 2}
                }),
                "Linking should merge base-outward and retain separate metadata and lookup IDs"
            );
            assert_eq!(
                linked(&profiles["sibling"]).value,
                json!({
                    "id": "parent-metadata",
                    "version": "parent-version",
                    "items": ["sibling", "parent", "base"],
                    "nested": null
                }),
                "Cached parents should retain their own values for each child"
            );
            assert_eq!(
                linked(&profiles["parent"]).value["items"],
                json!(["parent", "base"]),
                "A requested parent should retain its resolved ancestor data"
            );
            for profile in profiles.values() {
                assert_eq!(
                    linked(profile).base_id,
                    "base",
                    "The base ID should identify the last loaded profile"
                );
            }
            source.loaded.sort();
            assert_eq!(
                source.loaded,
                ["base", "child", "parent", "sibling"],
                "Each encountered profile should load once per call"
            );
        }
    }

    /// Parent nulls clear inherited arguments before a child omits or replaces
    /// them, including when the child supplies a new argument list.
    #[test]
    fn link_raw_profiles_arguments() {
        for (parent, child, expected) in [
            (json!(null), None, json!(null)),
            (
                json!(null),
                Some(json!({"jvm": ["-Dchild=true"]})),
                json!({"jvm": ["-Dchild=true"]}),
            ),
            (
                json!({"game": null}),
                Some(json!({"game": ["--child"]})),
                json!({"game": ["--child"]}),
            ),
        ] {
            let mut profile = json!({"id": "child", "inheritsFrom": "parent"});
            if let Some(arguments) = child {
                profile["arguments"] = arguments;
            }
            let mut source = Source::new([
                ("child", profile),
                (
                    "parent",
                    json!({
                        "id": "parent",
                        "inheritsFrom": "base",
                        "arguments": parent
                    }),
                ),
                (
                    "base",
                    json!({"id": "base", "arguments": {"game": ["--base"]}}),
                ),
            ]);
            let profiles = link_profile_content(["child"].into_iter(), &mut source);
            assert_eq!(
                linked(&profiles["child"]).value.get("arguments"),
                Some(&expected),
                "Child arguments should preserve the parent's clearing of base arguments"
            );
        }
    }

    /// Arbitrary JSON bodies link under their lookup IDs while retaining their
    /// contents for subsequent schema validation.
    #[test]
    fn link_raw_profiles_body() {
        for body in [
            json!(null),
            json!(true),
            json!(42),
            json!("profile"),
            json!([1, "entry"]),
            json!({}),
            json!({"id": null}),
            json!({"id": "different"}),
        ] {
            let mut source = Source::new([("lookup", body.clone())]);
            let profiles = link_profile_content(["lookup"].into_iter(), &mut source);
            assert_eq!(
                linked(&profiles["lookup"]).value,
                body,
                "Linking should preserve the body under its lookup ID"
            );
            assert_eq!(
                linked(&profiles["lookup"]).base_id,
                "lookup",
                "The base ID should come from the lookup"
            );
        }
    }

    /// Missing and non-string inheritance values end resolution without adding
    /// a version field to the completed document.
    #[test]
    fn link_raw_profiles_termination() {
        for profile in [
            json!({"id": "metadata"}),
            json!({"id": "metadata", "inheritsFrom": null}),
            json!({"id": "metadata", "inheritsFrom": 1}),
        ] {
            let mut source = Source::new([("lookup", profile)]);
            let profiles = link_profile_content(["lookup"].into_iter(), &mut source);
            assert_eq!(
                linked(&profiles["lookup"]).value,
                json!({"id": "metadata"}),
                "Terminal profiles should remove inheritance and preserve source fields"
            );
            assert_eq!(
                linked(&profiles["lookup"]).base_id,
                "lookup",
                "Standalone profiles should use their requested ID as the base ID"
            );
        }
    }

    /// Empty requested and inherited IDs load their documents and remain valid
    /// base IDs in completed results.
    #[test]
    fn link_raw_profiles_empty_id() {
        let mut source = Source::new([
            ("", json!({"id": "base-metadata", "base": true})),
            ("child", json!({"id": "child-metadata", "inheritsFrom": ""})),
        ]);
        let profiles = link_profile_content(["", "child"].into_iter(), &mut source);
        assert_eq!(
            linked(&profiles[""]).value,
            json!({"id": "base-metadata", "base": true}),
            "An empty requested ID should retain its loaded document"
        );
        assert_eq!(
            linked(&profiles["child"]).value,
            json!({"id": "child-metadata", "base": true}),
            "An empty parent ID should contribute fields with inheritance removed"
        );
        for profile in profiles.values() {
            assert_eq!(
                linked(profile).base_id,
                "",
                "An empty terminal lookup should remain the base ID"
            );
        }
        assert_eq!(
            source.loaded,
            ["", "child"],
            "Empty requested and inherited IDs should share the same cached result"
        );
    }

    /// Shared loader failures produce owned errors for every dependent while
    /// successful requests on either side of the failures still resolve.
    #[test]
    fn link_raw_profiles_loader_error() {
        for missing in ["missing", ""] {
            let mut source = Source::new([
                ("good", json!({"id": "good"})),
                ("child", json!({"id": "child", "inheritsFrom": missing})),
                ("sibling", json!({"inheritsFrom": missing})),
                ("later", json!(42)),
            ]);
            let mut profiles = link_profile_content(
                ["good", "child", "sibling", missing, "child", "later"].into_iter(),
                &mut source,
            );
            assert_eq!(
                profiles.len(),
                5,
                "Every distinct requested ID should have a result"
            );
            assert_eq!(
                linked(&profiles["good"]).value,
                json!({"id": "good"}),
                "Earlier results should remain available"
            );
            assert_eq!(
                linked(&profiles["later"]).value,
                json!(42),
                "Later requests should resolve after failures"
            );
            for id in ["child", "sibling", missing] {
                let error = profiles
                    .remove(id)
                    .expect("Each requested ID should have a result")
                    .expect_err("A missing ancestor should fail its dependent");
                assert_matches!(
                    error,
                    LinkError::Loader { id, source: Missing } if id == missing,
                    "Loader errors should retain the failed lookup and owned source error"
                );
            }
            source.loaded.sort();
            let mut expected = ["good", "child", "sibling", missing, "later"];
            expected.sort();
            assert_eq!(
                source.loaded, expected,
                "Shared failing lookups and duplicate requests should load only once"
            );
        }
    }

    /// Cycles fail each dependent under its requested ID while unrelated
    /// requests succeed and cached bodies avoid repeated loads.
    #[test]
    fn link_raw_profiles_unsatisfied() {
        for parent in ["bad", "parent", ""] {
            let mut source = Source::new([
                ("good", json!({"id": "good"})),
                ("bad", json!({"inheritsFrom": parent})),
                ("parent", json!({"inheritsFrom": "bad"})),
                ("", json!({"inheritsFrom": "bad"})),
                ("dependent", json!({"inheritsFrom": "bad"})),
                ("later", json!({})),
            ]);
            let profiles = link_profile_content(
                ["good", "bad", "dependent", "later", "bad"].into_iter(),
                &mut source,
            );
            assert_eq!(
                profiles.len(),
                4,
                "Cyclic and successful requests should all have results"
            );
            for requested in ["bad", "dependent"] {
                let error = profiles[requested]
                    .as_ref()
                    .expect_err("Cycles should fail resolution");
                assert_matches!(
                    error,
                    LinkError::Unsatisfied { id } if id == requested,
                    "Cycle errors should identify each requested profile"
                );
            }
            linked(&profiles["good"]);
            linked(&profiles["later"]);
            assert_eq!(
                source.loaded.iter().filter(|id| *id == "bad").count(),
                1,
                "Cycle detection should reuse cached bodies"
            );
        }
    }

    /// An empty requested ID that inherits itself reports a cycle before a
    /// second load.
    #[test]
    fn link_raw_profiles_empty_id_cycle() {
        let mut source = Source::new([("", json!({"id": "metadata", "inheritsFrom": ""}))]);
        let mut profiles = link_profile_content([""].into_iter(), &mut source);
        let error = profiles
            .remove("")
            .expect("The empty requested ID should have a result")
            .expect_err("Empty IDs should participate in cycle detection");
        assert_matches!(
            error,
            LinkError::Unsatisfied { id } if id.is_empty(),
            "A cycle should identify the empty requested ID"
        );
        assert_eq!(source.loaded, [""], "A cycle should stop before reloading");
    }

    /// Separate calls reload both successful and failed lookups so changes in
    /// the source become visible.
    #[test]
    fn link_raw_profiles_cache_scope() {
        let mut source = Source::new([("good", json!(1))]);
        let first = link_profile_content(["good", "missing"].into_iter(), &mut source);
        assert_eq!(
            linked(&first["good"]).value,
            json!(1),
            "The initial body should resolve"
        );
        first["missing"]
            .as_ref()
            .expect_err("The missing lookup should fail initially");

        source.profiles.insert("good", json!(2));
        source.profiles.insert("missing", json!(3));
        let second = link_profile_content(["good", "missing"].into_iter(), &mut source);
        assert_eq!(
            linked(&second["good"]).value,
            json!(2),
            "A new call should load updated bodies"
        );
        assert_eq!(
            linked(&second["missing"]).value,
            json!(3),
            "A new call should retry failed lookups"
        );
        assert_eq!(
            source.loaded,
            ["good", "missing", "good", "missing"],
            "Each call should have its own loader cache"
        );
    }

    /// Nested objects retain missing members, accept new members, and use head
    /// values on conflicts.
    #[test]
    fn merge_json_objects() {
        let base = json!({
            "nested": {"keep": 1, "replace": 2},
            "empty": {"keep": true},
            "clear": 3
        });
        let head = json!({
            "nested": {"replace": 4, "add": 5},
            "empty": {},
            "clear": null
        });
        assert_eq!(
            merge_json(base, head),
            json!({
                "nested": {"keep": 1, "replace": 4, "add": 5},
                "empty": {"keep": true},
                "clear": null
            }),
            "Objects should merge recursively while explicit null clears an inherited value"
        );
    }

    /// Arrays preserve child-first order and duplicates, including when either
    /// array is empty.
    #[test]
    fn merge_json_arrays() {
        for (base, head, expected) in [
            (json!([1, 2]), json!([2, 3]), json!([2, 3, 1, 2])),
            (json!([1]), json!([]), json!([1])),
            (json!([]), json!([2]), json!([2])),
            (json!([]), json!([]), json!([])),
        ] {
            assert_eq!(
                merge_json(json!({"items": base}), json!({"items": head})),
                json!({"items": expected}),
                "Nested arrays should retain all head elements before base elements"
            );
        }
    }

    /// Scalars, nulls, and mismatched types are replaced by the head value.
    #[test]
    fn merge_json_replacement() {
        for (base, head) in [
            (json!(1), json!(0)),
            (json!(true), json!(false)),
            (json!("base"), json!("")),
            (json!({"a": 1}), json!(null)),
            (json!(null), json!({"b": 2})),
            (json!({"a": 1}), json!([])),
            (json!([1]), json!({})),
        ] {
            assert_eq!(
                merge_json(base, head.clone()),
                head,
                "Replacement should preserve the head value"
            );
        }
    }

    /// Base-outward grouping preserves a parent's null override when a child
    /// supplies a replacement object.
    #[test]
    fn merge_json_grouping() {
        let base = json!({"x": {"a": 1}});
        let parent = json!({"x": null});
        let child = json!({"x": {"b": 2}});
        assert_eq!(
            merge_json(merge_json(base, parent), child),
            json!({"x": {"b": 2}}),
            "Base-outward merging should preserve the clearing of base members"
        );
    }
}
