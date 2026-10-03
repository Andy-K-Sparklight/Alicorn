//! Game version and asset metadata.
//!
//! JSON uses Minecraft metadata field names and omits absent optional fields.

pub mod detail;

use std::collections::HashMap;

use serde::Deserialize;
use serde::Deserializer;
use serde::Serialize;
use serde_with::skip_serializing_none;

use super::env::OsName;

/// Profile of a game core.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameCoreInfo {
    pub id: String,
    #[serde(flatten)]
    pub launch_args: LaunchArgs,
    pub asset_index: AssetIndexArt,
    /// ID of the asset index.
    ///
    /// Literally, this key equals to `assetIndex.id` for all profiles at the
    /// time of writing this. (Perhaps in ancient era they're stored
    /// separately?)
    pub assets: String,
    /// A numeric value defining the "generation" of this profile.
    ///
    /// Reading this value should have told the structure of the profile (i.e.,
    /// it works like a tag). However, profiles can have this field omitted
    /// (which happens frequently in those generated in earlier days). Not very
    /// useful since it does not look like guiding the interpretation of
    /// anything.
    #[serde(default)]
    pub compliance_level: i32, // Defensively for negative values

    /// The base profile that this profile will patch on.
    pub inherits_from: Option<String>,

    /// Artifacts of the main game.
    pub downloads: GameArts,

    /// Java runtime spec.
    pub java_version: Option<JavaSpec>,

    /// Runtime libraries.
    pub libraries: Vec<Library>,

    /// Logging configuration.
    pub logging: Option<GameLogging>,

    /// Main class for starting up.
    pub main_class: String,

    /// Release type.
    #[serde(rename = "type")]
    pub the_type: String,
}

/// Launch arguments.
#[derive(Serialize, Deserialize)]
pub enum LaunchArgs {
    #[serde(rename = "arguments")]
    Structured(StructuredLaunchArgs),

    #[serde(rename = "minecraftArguments")]
    Plain(String),
}

#[derive(Serialize, Deserialize)]
pub struct StructuredLaunchArgs {
    pub game: Vec<LaunchArg>,
    pub jvm: Vec<LaunchArg>,
}

/// A launch argument.
#[derive(Serialize)]
#[serde(untagged)]
pub enum LaunchArg {
    Literal(String),
    Gated(GatedArg),
}

#[derive(Serialize, Deserialize)]
pub struct GatedArg {
    pub value: ArgValue,
    pub rules: Option<Vec<Rule>>,
}

impl<'a> Deserialize<'a> for LaunchArg {
    fn deserialize<D: Deserializer<'a>>(deserializer: D) -> Result<Self, D::Error> {
        deserializer.deserialize_any(detail::LaunchArgVis)
    }
}

/// One or multiple arguments.
#[derive(Serialize)]
#[serde(untagged)]
pub enum ArgValue {
    Single(String),
    Multiple(Vec<String>),
}

impl<'de> Deserialize<'de> for ArgValue {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        deserializer.deserialize_any(detail::ArgValueVis)
    }
}

/// Rule for conditionally-enabled items.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct Rule {
    pub action: RuleAct,
    pub features: Option<HashMap<String, bool>>,
    pub os: Option<OsRule>,
}

/// Rule action.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RuleAct {
    Allow,
    Disallow,
}

/// A rule item that checks certain properties of the OS.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct OsRule {
    pub name: Option<OsName>,
    pub version: Option<String>,
    pub arch: Option<String>,
}

/// The artifact of the asset index itself.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetIndexArt {
    pub id: String,
    pub total_size: u64,
    #[serde(flatten)]
    pub download: Download,
}

/// Main game artifacts.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct GameArts {
    pub client: Download,
    pub server: Option<Download>,
    pub client_mappings: Option<Download>,
}

/// Source of fetching a file.
#[derive(Serialize, Deserialize)]
pub struct Download {
    pub sha1: String,
    pub size: u64,
    pub url: String,
}

/// The Java runtime component and its corresponding major version.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JavaSpec {
    pub component: String,
    pub major_version: Option<u32>,
}

/// Logging configuration.
#[derive(Serialize, Deserialize)]
pub struct GameLogging {
    pub client: ClientLogging,
}

/// A logging launch argument and its configuration download.
#[derive(Serialize, Deserialize)]
pub struct ClientLogging {
    pub argument: String,
    pub file: LogConfArt,
}

/// Logging configuration file artifact.
#[derive(Serialize, Deserialize)]
pub struct LogConfArt {
    pub id: String,
    #[serde(flatten)]
    pub download: Download,
}

/// Library metadata.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct Library {
    pub downloads: Option<LibraryVariants>,
    /// Maven identifier.
    pub name: String,
    /// Maps [`OsName`] to the corresponding classifier.
    pub natives: Option<HashMap<OsName, String>>,
    pub rules: Option<Vec<Rule>>,
    /// Controls the extraction behavior.
    pub extract: Option<LibraryExtract>,

    /// A set of untagged checksums. Looks like Forge-specific.
    ///
    /// Forge checks whether the SHA-1 hash of the JAR archive hits any of them.
    /// It's likely we shall do the same.
    #[serde(rename = "checksums")]
    pub checksum_list: Option<Vec<String>>,

    /// (Forge) Whether to fetch this for server.
    #[serde(rename = "serverreq", default)]
    pub server_needed: Option<bool>, /* Option is not needed but provides better serialized
                                      * output. TODO: Skip serialization when false? */

    /// (Forge) Whether to fetch this for client.
    #[serde(rename = "clientreq", default)]
    pub client_needed: Option<bool>,

    /// Maven repository URL of this library. Defaults to the vanilla one if
    /// missing. Not to be confused with the artifact URL.
    pub url: Option<String>,

    /// (Fabric) JAR SHA-1 hash.
    pub sha1: Option<String>,

    /// (Fabric) JAR SHA-512 hash.
    ///
    /// This field is extracted when present as it comes with less possibility
    /// of collision attack (though that's really unlikely).
    pub sha512: Option<String>,

    /// (Fabric) JAR size.
    pub size: Option<u64>,
}

/// Downloadable items of a library.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct LibraryVariants {
    pub artifact: Option<LibraryArt>,
    pub classifiers: Option<HashMap<String, LibraryArt>>,
}

/// Library extraction configuration.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct LibraryExtract {
    pub exclude: Option<Vec<String>>,
}

/// A library artifact.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct LibraryArt {
    /// Path to the artifact under libraries root.
    pub path: Option<String>,

    #[serde(flatten)]
    pub download: Download,
}

/// Asset index.
#[skip_serializing_none]
#[derive(Serialize, Deserialize)]
pub struct AssetIndex {
    /// Whether to "map the assets to resources", which stores assets by name in
    /// the `resources` directory. Used in some of the early releases.
    pub map_to_resources: Option<bool>,

    /// Asset catalog by name.
    pub objects: HashMap<String, AssetObject>,
}

/// An asset's content hash and size in bytes.
#[derive(Serialize, Deserialize)]
pub struct AssetObject {
    /// Hash string (lowercase) of this asset.
    pub hash: String,
    pub size: u64,
}

#[cfg(test)]
mod tests {
    use serde_json::from_str;
    use serde_json::from_value;
    use serde_json::json;
    use serde_json::to_value;

    use super::*;

    /// Structured JSON preserves argument variants, order, and attached rules.
    #[test]
    fn launch_args_structured() -> Result<(), serde_json::Error> {
        let args: LaunchArgs = from_value(json!({
            "arguments": {
                "game": [
                    "literal",
                    {
                        "value": "single"
                    },
                    {
                        "value": [
                            "first",
                            "second"
                        ],
                        "rules": [
                            {
                                "action": "disallow",
                                "os": {
                                    "name": "osx"
                                }
                            },
                            {
                                "action": "allow",
                                "features": {
                                    "demo": false
                                }
                            }
                        ]
                    }
                ],
                "jvm": [
                    "-Xmx1G"
                ]
            }
        }))?;
        let LaunchArgs::Structured(args) = args else {
            panic!("Structured arguments should select the structured variant");
        };
        let [
            LaunchArg::Literal(literal),
            LaunchArg::Gated(single),
            LaunchArg::Gated(multiple),
        ] = args.game.as_slice()
        else {
            panic!("Game arguments should retain their variants and order");
        };
        assert_eq!(
            literal, "literal",
            "Literal arguments should retain their value"
        );
        assert!(
            matches!(&single.value, ArgValue::Single(value) if value == "single"),
            "String values should select the single variant"
        );
        assert!(single.rules.is_none(), "Absent rules should remain absent");
        assert!(
            matches!(&multiple.value, ArgValue::Multiple(values) if values == &["first", "second"]),
            "Array values should retain their order"
        );
        let rules = multiple
            .rules
            .as_deref()
            .expect("Attached rules should be present");
        assert_eq!(rules.len(), 2, "Both rules should be retained");
        assert!(
            matches!(rules[0].action, RuleAct::Disallow)
                && matches!(&rules[0].os, Some(os) if os.name == Some(OsName::Osx)),
            "The first rule should disallow macOS"
        );
        assert!(
            matches!(rules[1].action, RuleAct::Allow)
                && rules[1]
                    .features
                    .as_ref()
                    .and_then(|features| features.get("demo"))
                    == Some(&false),
            "The second rule should retain its false feature condition"
        );
        assert!(
            matches!(args.jvm.as_slice(), [LaunchArg::Literal(value)] if value == "-Xmx1G"),
            "JVM arguments should remain separate from game arguments"
        );
        Ok(())
    }

    /// Invalid JSON shapes and gated objects without a value fail to
    /// deserialize.
    #[test]
    fn launch_arg_invalid_shape() {
        for input in ["null", "true", "1", "[]", "{}", r#"{"rules":[]}"#] {
            assert!(
                from_str::<LaunchArg>(input).is_err(),
                "Unsupported launch argument {input} should fail"
            );
        }
    }

    /// JSON arrays preserve their multiplicity and order while rejecting
    /// non-string elements.
    #[test]
    fn arg_value_array() -> Result<(), serde_json::Error> {
        for values in [vec![], vec!["one"], vec!["one", "two"]] {
            let parsed: ArgValue = from_value(json!(values))?;
            assert!(
                matches!(parsed, ArgValue::Multiple(actual) if actual == values),
                "Arrays should retain their variant and elements"
            );
        }
        for input in ["null", "true", "1", "{}", r#"["one", 2]"#, r#"[["one"]]"#] {
            assert!(
                from_str::<ArgValue>(input).is_err(),
                "Unsupported argument value {input} should fail"
            );
        }
        Ok(())
    }

    /// Legacy and structured launch arguments retain their JSON representation
    /// through both readers.
    #[test]
    fn launch_args_roundtrip() -> Result<(), serde_json::Error> {
        for input in [
            json!({
                "minecraftArguments": "--username ${auth_player_name}"
            }),
            json!({
                "arguments": {
                    "game": [
                        "--demo",
                        {
                            "value": "single",
                            "rules": []
                        },
                        {
                            "value": [
                                "first",
                                "second"
                            ],
                            "rules": []
                        }
                    ],
                    "jvm": []
                }
            }),
        ] {
            for parsed in [
                from_str::<LaunchArgs>(&input.to_string())?,
                from_value::<LaunchArgs>(input.clone())?,
            ] {
                assert_eq!(
                    to_value(parsed)?,
                    input,
                    "Launch argument JSON should round-trip"
                );
            }
        }
        Ok(())
    }

    /// Minimal legacy and modern profiles flatten launch arguments and default
    /// absent sections.
    #[test]
    fn game_core_profile_layout() -> Result<(), serde_json::Error> {
        for (key, args) in [
            ("minecraftArguments", json!("--demo")),
            (
                "arguments",
                json!({
                    "game": [],
                    "jvm": []
                }),
            ),
        ] {
            let input = json!({
                "id": "test",
                (key): args,
                "assetIndex": {
                    "id": "test",
                    "totalSize": 0,
                    "sha1": "hash",
                    "size": 0,
                    "url": "index"
                },
                "assets": "test",
                "downloads": {
                    "client": {
                        "sha1": "hash",
                        "size": 0,
                        "url": "client"
                    }
                },
                "libraries": [],
                "mainClass": "Main",
                "type": "release"
            });
            let profile: GameCoreInfo = from_value(input.clone())?;
            assert_eq!(
                profile.compliance_level, 0,
                "Absent compliance level should default to zero"
            );
            assert!(
                profile.inherits_from.is_none()
                    && profile.java_version.is_none()
                    && profile.logging.is_none(),
                "Absent optional profile sections should remain absent"
            );
            assert!(
                matches!(
                    (&profile.launch_args, key),
                    (LaunchArgs::Plain(_), "minecraftArguments")
                        | (LaunchArgs::Structured(_), "arguments")
                ),
                "The flattened key should select the launch argument variant"
            );
            let mut expected = input;
            expected["complianceLevel"] = json!(0);
            assert_eq!(
                to_value(profile)?,
                expected,
                "Profile JSON should retain its flattened layout"
            );
        }
        Ok(())
    }

    /// Artifact wrappers keep download fields flat, including optional library
    /// paths.
    #[test]
    fn artifact_download_layout() -> Result<(), serde_json::Error> {
        let download = json!({
            "sha1": "hash",
            "size": 42,
            "url": "artifact"
        });
        let mut index = download.clone();
        index["id"] = json!("assets");
        index["totalSize"] = json!(100);
        assert_eq!(
            to_value(from_value::<AssetIndexArt>(index.clone())?)?,
            index,
            "Asset index downloads should remain flat with camelCase totalSize"
        );
        let mut log = download.clone();
        log["id"] = json!("logging");
        assert_eq!(
            to_value(from_value::<LogConfArt>(log.clone())?)?,
            log,
            "Logging downloads should remain flat"
        );
        for path in [None, Some("org/example/library.jar")] {
            let mut library = download.clone();
            if let Some(path) = path {
                library["path"] = json!(path);
            }
            assert_eq!(
                to_value(from_value::<LibraryArt>(library.clone())?)?,
                library,
                "Library downloads should preserve their flat layout and optional path"
            );
        }
        Ok(())
    }

    /// Forge field names round-trip while absent flags remain distinct from
    /// explicit false.
    #[test]
    fn library_extension_fields() -> Result<(), serde_json::Error> {
        for (server, client) in [
            (None, None),
            (Some(false), Some(true)),
            (Some(true), Some(false)),
        ] {
            let mut input = json!({
                "name": "org.example:library:1",
                "checksums": [
                    "first",
                    "second"
                ]
            });
            if let Some(flag) = server {
                input["serverreq"] = json!(flag);
            }
            if let Some(flag) = client {
                input["clientreq"] = json!(flag);
            }
            let library: Library = from_value(input.clone())?;
            assert_eq!(
                library.server_needed, server,
                "Server flags should preserve absence and false"
            );
            assert_eq!(
                library.client_needed, client,
                "Client flags should preserve absence and false"
            );
            assert!(
                matches!(&library.checksum_list, Some(values) if values == &["first", "second"]),
                "Forge checksums should populate the checksum list"
            );
            assert_eq!(
                to_value(library)?,
                input,
                "Forge metadata should retain its wire names"
            );
        }
        Ok(())
    }
}
