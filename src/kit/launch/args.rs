//! Launch argument generation from prepared target paths.

use std::borrow::Cow;
use std::collections::HashSet;
use std::sync::LazyLock;

use serde::Deserialize;
use thiserror::Error;

use crate::include_embedded;
use crate::kit::auth::Credentials;
use crate::kit::profile::maven::MavenName;
use crate::kit::profile::maven::MavenNameError;
use crate::kit::profile::rules::RuleEnv;
use crate::kit::profile::version::LaunchArg;
use crate::kit::profile::version::LaunchArgs;
use crate::kit::profile::version::Library;
use crate::kit::profile::version::VersionProfile;
use crate::util::ts::interpret_ts;

include_embedded!(default_vm_args);

/// Defines borrowed template values and optional owned values with field-name
/// lookup.
macro_rules! template_values {
    ($name:ident { $($field:ident),* $(,)? } optional { $($optional:ident),* $(,)? }) => {
        /// Values substituted for launch template placeholders.
        struct $name<'a> {
            $($field: Cow<'a, str>,)*
            $($optional: Option<Cow<'a, str>>,)*
        }

        impl $name<'_> {
            /// Returns a resolver for [`interpret_ts`], leaving unknown or absent values unresolved.
            fn resolver<'s>(&'s self) -> impl Fn(&str) -> Option<&'s str> {
                move |key| match key {
                    $(stringify!($field) => Some(&*self.$field),)*
                    $(stringify!($optional) => self.$optional.as_deref(),)*
                    _ => None,
                }
            }
        }
    };
}

template_values!(TemplateValues {
    version_name,
    version_type,
    assets_index_name,
    auth_player_name,
    auth_uuid,
    auth_session,
    auth_access_token,
    auth_xuid,
    user_type,
    user_properties,
    clientid,
    launcher_name,
    launcher_version,
    game_directory,
    assets_root,
    game_assets,
    natives_directory,
    library_directory,
    classpath,
    classpath_separator,
} optional {
    resolution_width,
    resolution_height,
});

#[derive(Deserialize)]
struct LegacyArgs {
    #[serde(rename = "vmArgs")] // XXX: Unwrap this once TS no longer needs it
    jvm: Vec<LaunchArg>,
}

/// Default JVM arguments for legacy versions.
static LEGACY_ARGS: LazyLock<LegacyArgs> = LazyLock::new(|| {
    serde_json::from_slice(&default_vm_args::LAZY_DATA)
        .expect("Embedded legacy JVM arguments should deserialize")
});

/// Information aggregation for generating arguments.
pub struct ArgInput<'a> {
    pub profile: &'a VersionProfile,
    pub env: RuleEnv<'a>,
    pub credentials: &'a Credentials,
    pub launcher: Launcher<'a>,
    pub paths: Paths<'a>,
    pub options: LaunchOpt<'a>,
}

/// Prepared path values expressed using the execution target's conventions.
pub struct Paths<'a> {
    pub game_directory: &'a str,
    pub assets_root: &'a str,
    /// Mapped resources or legacy assets directory for `${game_assets}`.
    pub game_assets: &'a str,
    pub natives_directory: &'a str,
    pub library_directory: &'a str,
    /// Extra entries, selected libraries, and the client JAR, joined in that
    /// order.
    pub classpath: &'a str,
    /// Separator used to join the target's classpath entries.
    pub classpath_separator: &'a str,
    /// Encoded file URL, required when the profile declares client logging.
    pub logging_config_url: Option<&'a str>,
}

/// Launcher identity supplied to argument templates.
pub struct Launcher<'a> {
    pub name: &'a str,
    pub version: &'a str,
    pub client_id: &'a str,
}

/// Optional launch settings and ordered argument contributions.
#[derive(Default)]
pub struct LaunchOpt<'a> {
    pub memory: Option<MemoryOpt>,
    pub window: Option<WindowOpt>,
    /// Overrides the profile's main class when nonempty.
    pub main_class: Option<&'a str>,
    /// JVM arguments appended after memory settings, preserving their order.
    pub extra_jvm: &'a [String],
    /// Game arguments appended after profile and legacy window arguments.
    pub extra_game: &'a [String],
}

impl LaunchOpt<'_> {
    /// Creates options with no overrides or additional arguments.
    pub fn new() -> Self { Self::default() }
}

/// Resolved heap limits in MiB; zero omits the corresponding argument.
#[derive(Debug, Copy, Clone)]
pub struct MemoryOpt {
    pub min: u32,
    pub max: u32,
}

/// Window dimensions used by templates and legacy window arguments.
///
/// Legacy size arguments are appended only when both dimensions are positive.
#[derive(Debug, Copy, Clone)]
pub struct WindowOpt {
    pub width: u32,
    pub height: u32,
}

/// A required argument-generation input is missing.
#[derive(Debug, Error)]
pub enum ArgsError {
    /// Client logging requires a prepared configuration URL.
    #[error("Missing logging configuration URL for {id}")]
    MissingLoggingConfig { id: String },
}

/// Filters and deduplicates `libraries` using `env`.
///
/// Libraries that only differs by version will have their first candidate
/// being retained. This is to ensure that no duplicated versions of the same
/// library is added to the classpath, which is probably wrong and
/// [will cause problems](https://github.com/FabricMC/fabric-loader/blob/0.19.0/src/main/java/net/fabricmc/loader/impl/util/LoaderUtil.java#L83).
pub fn filter_libraries<'a>(
    libraries: impl IntoIterator<Item = &'a Library> + 'a,
    env: &'a RuleEnv<'_>,
) -> impl Iterator<Item = Result<&'a Library, MavenNameError>> + 'a {
    let mut seen = HashSet::new();
    libraries.into_iter().filter_map(move |library| {
        if !env.justify(library.rules.as_deref()).is_allowed() {
            return None;
        }
        let name = match MavenName::parse(&library.name) {
            Ok(name) => name,
            Err(ex) => return Some(Err(ex)),
        };
        seen.insert((name.group, name.artifact, name.classifier, name.extension))
            .then_some(Ok(library))
    })
}

/// Generates JVM arguments, the main class, and game arguments in launch order.
///
/// JVM arguments consist of profile arguments, logging settings, memory
/// settings, and extra JVM arguments. Game arguments consist of profile
/// arguments, legacy window settings, and extra game arguments.
///
/// Legacy profiles use default JVM arguments and split game arguments on
/// literal spaces, preserving empty elements. Absent rules allow an argument;
/// explicit empty rule lists disallow it. Feature flags come from `input.env`.
///
/// Template substitution applies to every output element and preserves unknown
/// placeholders. Each element remains one argument without shell quoting.
///
/// # Errors
///
/// Returns [`ArgsError::MissingLoggingConfig`] when client logging is declared
/// without a prepared configuration URL, before iteration begins.
pub fn create_arguments<'a>(
    input: &'a ArgInput<'_>,
) -> Result<impl Iterator<Item = Cow<'a, str>> + 'a, ArgsError> {
    let profile = input.profile;
    let logging = if let Some(logging) = &profile.logging {
        let url =
            input
                .paths
                .logging_config_url
                .ok_or_else(|| ArgsError::MissingLoggingConfig {
                    id: logging.client.file.id.clone(),
                })?;
        Some((logging, url))
    } else {
        None
    };
    let (jvm, game, plain) = match &profile.launch_args {
        LaunchArgs::Structured(args) => (args.jvm.as_slice(), args.game.as_slice(), None),
        LaunchArgs::Plain(game) => (LEGACY_ARGS.jvm.as_slice(), &[][..], Some(game.as_str())),
    };
    let logging = logging.into_iter().flat_map(|(logging, url)| {
        core::iter::once_with(move || Cow::Owned(logging.client.argument.replace("${path}", url)))
            .chain([
                Cow::Borrowed("-Dlog4j2.formatMsgNoLookups=true"),
                Cow::Borrowed("-Dcom.sun.jndi.rmi.object.trustURLCodebase=false"),
                Cow::Borrowed("-Dcom.sun.jndi.cosnaming.object.trustURLCodebase=false"),
            ])
    });
    let memory = input.options.memory.into_iter().flat_map(|memory| {
        [("Xms", memory.min), ("Xmx", memory.max)]
            .into_iter()
            .filter(|(_, size)| *size > 0)
            .map(|(flag, size)| Cow::Owned(format!("-{flag}{size}M")))
    });
    let window = input
        .options
        .window
        .filter(|window| plain.is_some() && window.width > 0 && window.height > 0)
        .into_iter()
        .flat_map(|window| {
            [
                Cow::Borrowed("--width"),
                Cow::Owned(window.width.to_string()),
                Cow::Borrowed("--height"),
                Cow::Owned(window.height.to_string()),
            ]
        });

    let args = select_arguments(jvm, &input.env)
        .chain(logging)
        .chain(memory)
        .chain(input.options.extra_jvm.iter().map(Into::into))
        .chain(core::iter::once(Cow::Borrowed(
            input
                .options
                .main_class
                .filter(|name| !name.is_empty())
                .unwrap_or(&profile.main_class),
        )))
        .chain(select_arguments(game, &input.env))
        .chain(
            plain
                .into_iter()
                .flat_map(|game| game.split(' '))
                .map(Cow::Borrowed),
        )
        .chain(window)
        .chain(input.options.extra_game.iter().map(Into::into));

    let values = TemplateValues {
        version_name: profile.vanilla_version.as_str().into(),
        version_type: profile.the_type.as_str().into(),
        assets_index_name: profile.assets.as_str().into(),
        auth_player_name: input.credentials.player_name.as_str().into(),
        auth_uuid: input.credentials.uuid.as_str().into(),
        auth_session: input.credentials.access_token.as_str().into(),
        auth_access_token: input.credentials.access_token.as_str().into(),
        auth_xuid: input.credentials.xbox_id.as_str().into(),
        user_type: input.credentials.user_type.as_str().into(),
        user_properties: "[]".into(),
        clientid: input.launcher.client_id.into(),
        launcher_name: input.launcher.name.into(),
        launcher_version: input.launcher.version.into(),
        game_directory: input.paths.game_directory.into(),
        assets_root: input.paths.assets_root.into(),
        game_assets: input.paths.game_assets.into(),
        natives_directory: input.paths.natives_directory.into(),
        library_directory: input.paths.library_directory.into(),
        classpath: input.paths.classpath.into(),
        classpath_separator: input.paths.classpath_separator.into(),
        resolution_width: input
            .options
            .window
            .map(|window| window.width.to_string().into()),
        resolution_height: input
            .options
            .window
            .map(|window| window.height.to_string().into()),
    };

    Ok(args.map(move |arg| interpret_ts(arg, values.resolver())))
}

/// Yields allowed arguments while preserving each gated value's boundaries.
fn select_arguments<'a>(
    args: impl IntoIterator<Item = &'a LaunchArg> + 'a,
    env: &'a RuleEnv<'_>,
) -> impl Iterator<Item = Cow<'a, str>> + 'a {
    args.into_iter()
        .flat_map(move |arg| match arg {
            LaunchArg::Literal(value) => core::slice::from_ref(value).iter(),
            LaunchArg::Gated(arg) if env.justify(arg.rules.as_deref()).is_allowed() => {
                (&arg.value).into_iter()
            }
            LaunchArg::Gated(_) => [].iter(),
        })
        .map(Into::into)
}
