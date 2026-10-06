use std::collections::BTreeMap;
use std::collections::BTreeSet;
use std::rc::Rc;

use thiserror::Error;

use crate::kit::profile::version::VersionProfile;
use crate::util::scoped::TheScoped;

/// A failure while resolving raw profile inheritance.
#[derive(Debug, Error)]
pub enum LinkError {
    /// Inheritance contains a cycle involving this lookup ID.
    #[error("Cyclic profile inheritance involving {id}")]
    Cycle { id: String },
}

/// A merged profile and its resolved base lookup ID.
#[derive(Debug, Clone)]
pub struct LinkedProfile {
    /// The merged document with `inheritsFrom` removed.
    pub value: serde_json::Value,
    /// The terminal ancestor's lookup ID.
    pub base_id: String,
}

/// Deserializes into [`VersionProfile`] and assign the vanilla version.
impl TryFrom<LinkedProfile> for VersionProfile {
    type Error = serde_json::Error;
    fn try_from(value: LinkedProfile) -> Result<Self, Self::Error> {
        serde_json::from_value::<Self>(value.value)?
            .apply(|it| it.vanilla_version = value.base_id)
            .then(Ok)
    }
}

/// The next step or completed result of a linking request.
#[derive(Debug)]
pub enum LinkerCmd<'a> {
    /// Supply this lookup ID's body before retrying the request.
    Pending(&'a str),

    /// The requested profile is resolved.
    Resolved(Rc<LinkedProfile>),

    /// The requested profile cannot resolve within this linker.
    Err(Rc<LinkError>),
}

/// Links caller-supplied profiles and retains their resolved ancestors.
///
/// Bodies are write-once by lookup ID. Use a new linker when source data
/// changes.
#[derive(Debug, Default)]
pub struct Linker {
    ids: BTreeMap<Rc<str>, usize>,
    nodes: Vec<Node>,
}

impl Linker {
    /// Creates a linker with no supplied profiles.
    pub fn new() -> Self { Self::default() }

    /// Supplies profile JSON data to the linker. Returns whether the new
    /// content is accepted.
    pub fn supply(&mut self, id: impl Into<String>, mut value: serde_json::Value) -> bool {
        // Can't use &mut here as the later parent insertion also takes &mut
        let index = self.node_id_of(&id.into());
        if !matches!(self.nodes[index].content, NodeContent::Missing) {
            return false;
        }

        let base_id = extract_parent(&mut value);
        let parent_node_id = base_id.map(|it| self.node_id_of(&it));

        self.nodes[index].parent = parent_node_id;
        self.nodes[index].content = NodeContent::Loaded(value);
        true
    }

    /// Requires a profile by its ID.
    ///
    /// The returned [`LinkerCmd`] indicates the availability: linked and
    /// available ([`LinkerCmd::Resolved`]), failed during linkage
    /// ([`LinkerCmd::Err`]) or pending for its dependency
    /// ([`LinkerCmd::Pending`]).
    pub fn require(&mut self, id: &str) -> LinkerCmd<'_> {
        let mut current = self.node_id_of(id);
        let mut chain = Vec::new();
        let mut visited = BTreeSet::new();

        // Traverse the tree to find the root
        let result = loop {
            let node = &mut self.nodes[current];

            match &node.content {
                NodeContent::Missing => return LinkerCmd::Pending(&self.nodes[current].id),
                NodeContent::Ready(profile) => break Ok(profile.to_owned()),
                NodeContent::Failed(ex) => break Err(ex.to_owned()),
                NodeContent::Loaded(_) => {}
            }

            // Cyclic detection
            if !visited.insert(current) {
                break Err(Rc::new(LinkError::Cycle {
                    id: (*node.id).to_owned(),
                }));
            }

            let Some(parent) = node.parent else {
                break Ok(node.finalize(None)); // Root found, finalize it first
            };

            chain.push(current); // Only add the index if it's not the root (already finalized)
            current = parent;
        };

        match result {
            Ok(mut profile) => {
                for index in chain.into_iter().rev() {
                    // Finalize each node in the chain, with the previous node as its parent
                    profile = self.nodes[index].finalize(Some(&profile));
                }
                LinkerCmd::Resolved(profile)
            }
            Err(ex) => {
                // A parent has errored, therefore none of its children can be linked
                for index in chain {
                    self.nodes[index].content = NodeContent::Failed(Rc::clone(&ex));
                }
                LinkerCmd::Err(ex)
            }
        }
    }

    /// Gets the node ID of the given profile ID, creating missing nodes.
    fn node_id_of(&mut self, id: &str) -> usize {
        if let Some(&index) = self.ids.get(id) {
            return index;
        }

        let id: Rc<str> = Rc::from(id);
        let index = self.nodes.len();
        self.nodes.push(Node {
            id: Rc::clone(&id),
            parent: None,
            content: NodeContent::Missing,
        });
        self.ids.insert(id, index);
        index
    }
}

/// Extracts the `inheritsFrom` key from the given JSON value.
fn extract_parent(v: &mut serde_json::Value) -> Option<String> {
    if let serde_json::Value::Object(o) = v
        && let Some(serde_json::Value::String(s)) = o.remove("inheritsFrom")
    {
        return Some(s);
    }

    None
}

/// A node in the resolution tree.
#[derive(Debug)]
struct Node {
    id: Rc<str>,
    parent: Option<usize>,
    content: NodeContent,
}

impl Node {
    /// Finalize this profile into a [`LinkedProfile`], patching on a clone of
    /// `parent` if supplied.
    ///
    /// # Panics
    ///
    /// This method may only be called on a node whose content is
    /// [`NodeContent::Loaded`], otherwise it panics.
    fn finalize(&mut self, parent: Option<&LinkedProfile>) -> Rc<LinkedProfile> {
        let NodeContent::Loaded(value) = &mut self.content else {
            panic!("Only loaded profiles may be finalized");
        };

        let value = value.take();

        let profile = if let Some(parent) = parent {
            LinkedProfile {
                value: merge_json(parent.value.to_owned(), value),
                base_id: parent.base_id.to_owned(),
            }
        } else {
            LinkedProfile {
                value,
                base_id: (*self.id).to_owned(),
            }
        };

        let profile = Rc::new(profile);
        self.content = NodeContent::Ready(Rc::clone(&profile));

        profile
    }
}

/// The linkage state of the profile.
#[derive(Debug)]
enum NodeContent {
    /// Concrete content is still missing.
    Missing,
    /// Content is ready but not yet linked.
    Loaded(serde_json::Value),
    /// Profile is ready.
    Ready(Rc<LinkedProfile>),
    /// Failure occurred.
    Failed(Rc<LinkError>),
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

    /// Creates a linker with the supplied test bodies.
    fn with_profiles(
        profiles: impl IntoIterator<Item = (&'static str, serde_json::Value)>,
    ) -> Linker {
        let mut linker = Linker::new();
        for (id, value) in profiles {
            assert!(linker.supply(id, value), "Each fixture should be accepted");
        }
        linker
    }

    /// Extracts a completed profile from a test request.
    fn ready(cmd: LinkerCmd<'_>) -> Rc<LinkedProfile> {
        let LinkerCmd::Resolved(profile) = cmd else {
            panic!("The request should resolve, got {cmd:?}");
        };
        profile
    }

    /// Drives resolution with fixtures that can each be loaded once.
    fn resolve(
        linker: &mut Linker,
        id: &str,
        source: &mut BTreeMap<&str, serde_json::Value>,
    ) -> Rc<LinkedProfile> {
        loop {
            match linker.require(id) {
                LinkerCmd::Pending(id) => {
                    let id = id.to_owned();
                    let value = source.remove(&*id).expect("Each body should load once");
                    assert!(
                        linker.supply(id, value),
                        "Requested bodies should be accepted"
                    );
                }
                cmd => return ready(cmd),
            }
        }
    }

    /// Shared ancestors and completed parents preserve merge precedence without
    /// reloading profiles or leaking one child's overrides into another.
    #[test]
    fn linker_inheritance() {
        for ids in [["child", "sibling", "parent", "child"], [
            "parent", "child", "sibling", "parent",
        ]] {
            let mut source = BTreeMap::from([
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
            let mut linker = Linker::new();
            let profiles: BTreeMap<_, _> = ids
                .into_iter()
                .map(|id| (id, resolve(&mut linker, id, &mut source)))
                .collect();
            assert_eq!(
                profiles["child"].value,
                json!({
                    "id": "child-metadata",
                    "version": "child-version",
                    "items": ["child", "parent", "base"],
                    "nested": {"b": 2}
                }),
                "Linking should merge base-outward and retain separate metadata and lookup IDs"
            );
            assert_eq!(
                profiles["sibling"].value,
                json!({
                    "id": "parent-metadata",
                    "version": "parent-version",
                    "items": ["sibling", "parent", "base"],
                    "nested": null
                }),
                "Cached parents should retain their own values for each child"
            );
            assert_eq!(
                profiles["parent"].value["items"],
                json!(["parent", "base"]),
                "A requested parent should retain its resolved ancestor data"
            );
            for profile in profiles.values() {
                assert_eq!(
                    profile.base_id, "base",
                    "The base ID should identify the last loaded profile"
                );
            }
            assert!(source.is_empty(), "All required bodies should have loaded");
            let parent = ready(linker.require("parent"));
            assert!(
                Rc::ptr_eq(&parent, &profiles["parent"]),
                "Repeated requests should share the resolved intermediate"
            );
            assert_eq!(
                ready(linker.require("base")).value["items"],
                json!(["base"]),
                "The terminal ancestor should remain available after resolving children"
            );
        }
    }

    /// Converting a valid profile with an ID-only patch assigns the base ID as
    /// its vanilla version while retaining the patched ID.
    #[test]
    fn linked_profile_conversion_vanilla_version() {
        let mut linker = with_profiles([
            (
                "base",
                json!({
                    "id": "base",
                    "minecraftArguments": "",
                    "assetIndex": {
                        "id": "base",
                        "totalSize": 0,
                        "sha1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
                        "size": 0,
                        "url": "https://example.com/assets.json"
                    },
                    "assets": "base",
                    "downloads": {
                        "client": {
                            "sha1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
                            "size": 0,
                            "url": "https://example.com/client.jar"
                        }
                    },
                    "libraries": [],
                    "mainClass": "net.minecraft.client.main.Main",
                    "type": "release"
                }),
            ),
            ("patched", json!({"id": "patched", "inheritsFrom": "base"})),
        ]);
        let linked_profile = ready(linker.require("patched"));
        let profile = VersionProfile::try_from((*linked_profile).clone())
            .expect("A linked valid profile should convert to VersionProfile");

        assert_eq!(profile.id, "patched", "The patched ID should be retained");
        assert_eq!(
            profile.vanilla_version, "base",
            "The vanilla version should be assigned from the base ID"
        );
    }

    /// Non-string inheritance is removed and terminates resolution.
    #[test]
    fn linker_termination() {
        let mut linker =
            with_profiles([("lookup", json!({"id": "metadata", "inheritsFrom": null}))]);
        let profile = ready(linker.require("lookup"));
        assert_eq!(
            profile.value,
            json!({"id": "metadata"}),
            "Terminal profiles should remove inheritance and preserve source fields"
        );
        assert_eq!(
            profile.base_id, "lookup",
            "Standalone profiles should use their requested ID as the base ID"
        );
    }

    /// Missing targets and shared dependencies remain loadable while requests
    /// interleave, then resolve after their bodies are supplied.
    #[test]
    fn linker_load_interleaved() {
        let mut linker = Linker::new();
        assert_matches!(
            linker.require("child"),
            LinkerCmd::Pending("child"),
            "An unsupplied target should request its body"
        );
        assert!(
            linker.supply("child", json!({"inheritsFrom": "parent", "child": true})),
            "A requested body should be accepted"
        );
        assert!(
            linker.supply("sibling", json!({"inheritsFrom": "parent"})),
            "An unrequested body should be accepted"
        );
        for requested in ["child", "sibling", "child"] {
            assert_matches!(
                linker.require(requested),
                LinkerCmd::Pending("parent"),
                "Interleaved requests should identify the same missing ancestor"
            );
        }
        assert!(
            linker.supply("parent", json!({"base": true})),
            "The missing ancestor should accept its body"
        );
        assert_eq!(
            ready(linker.require("sibling")).value,
            json!({"base": true}),
            "The sibling should resolve after its parent is supplied"
        );
        assert_eq!(
            ready(linker.require("child")).value,
            json!({"base": true, "child": true}),
            "A resumed request should merge its supplied ancestor"
        );
    }

    /// Self-cycles and multi-node cycles fail their dependents while unrelated
    /// profiles remain resolvable before and after the failure.
    #[test]
    fn linker_cycles() {
        for parent in ["bad", "parent"] {
            let mut linker = with_profiles([
                ("bad", json!({"inheritsFrom": parent})),
                ("dependent", json!({"inheritsFrom": "bad"})),
                ("good", json!(1)),
                ("later", json!(2)),
            ]);
            if parent != "bad" {
                assert!(
                    linker.supply(parent, json!({"inheritsFrom": "bad"})),
                    "The second cycle member should accept its body"
                );
            }
            let good = ready(linker.require("good"));
            for requested in ["dependent", "bad", parent] {
                let LinkerCmd::Err(ex) = linker.require(requested) else {
                    panic!("Cyclic profiles and their dependents should fail");
                };
                assert_matches!(
                    &*ex,
                    LinkError::Cycle { id } if id == "bad" || id == parent,
                    "Cycle errors should identify a member of the cycle"
                );
            }
            assert!(
                linker.supply("sibling", json!({"inheritsFrom": "bad"})),
                "A new dependent should accept its body after a cycle is detected"
            );
            assert_matches!(
                linker.require("sibling"),
                LinkerCmd::Err(_),
                "A new dependent should inherit the cached cycle failure"
            );
            assert!(
                !linker.supply("bad", json!({})),
                "A failed profile should retain its original body"
            );
            assert_matches!(
                linker.require("bad"),
                LinkerCmd::Err(_),
                "Rejected replacement should preserve the cycle failure"
            );
            assert_eq!(good.value, json!(1), "Earlier results should remain usable");
            assert_eq!(
                ready(linker.require("later")).value,
                json!(2),
                "Unrelated profiles should resolve after a cycle failure"
            );
        }
    }

    /// Duplicate supplies preserve unresolved bodies and completed results.
    #[test]
    fn linker_supply_write_once() {
        let mut linker = with_profiles([
            ("child", json!({"inheritsFrom": "base", "child": true})),
            ("base", json!({"base": 1})),
        ]);
        assert!(
            !linker.supply("child", json!({"inheritsFrom": "other"})),
            "An unresolved body should reject replacement"
        );
        let child = ready(linker.require("child"));
        assert!(
            !linker.supply("base", json!(null)),
            "A completed ancestor should reject replacement"
        );
        assert!(
            !linker.supply("child", json!({})),
            "A completed target should reject replacement"
        );
        assert!(
            Rc::ptr_eq(&child, &ready(linker.require("child"))),
            "Rejected supplies should preserve the cached result"
        );
        assert_eq!(
            child.value,
            json!({"base": 1, "child": true}),
            "Rejected supplies should preserve the original inheritance and body"
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

    /// Arrays preserve child-first order and duplicates.
    #[test]
    fn merge_json_arrays() {
        assert_eq!(
            merge_json(json!([1, 2]), json!([2, 3])),
            json!([2, 3, 1, 2]),
            "Arrays should retain all head elements before base elements"
        );
    }

    /// Scalars, nulls, and mismatched types are replaced by the head value.
    #[test]
    fn merge_json_replacement() {
        for (base, head) in [
            (json!(1), json!(0)),
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
}
