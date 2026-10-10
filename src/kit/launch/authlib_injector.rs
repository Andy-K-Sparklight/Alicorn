//! Optional authlib-injector JVM arguments.

/// Creates agent arguments from a prepared target path and authentication host.
///
/// An empty host produces no arguments. A nonempty prefetch payload adds the
/// prefetched-metadata property after the agent argument.
pub fn create_arguments<'a>(
    agent_path: &'a str,
    host: &'a str,
    prefetch: Option<&'a str>,
) -> impl Iterator<Item = String> + 'a {
    let enabled = !host.is_empty();
    let agent = enabled
        .then_some((agent_path, host))
        .into_iter()
        .map(|(path, host)| format!("-javaagent:{path}={host}"));
    let prefetch = prefetch
        .filter(|value| enabled && !value.is_empty())
        .into_iter()
        .map(|value| format!("-Dauthlibinjector.yggdrasil.prefetched={value}"));
    agent.chain(prefetch)
}
