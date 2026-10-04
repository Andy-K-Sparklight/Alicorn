/**
 * Pools profile runtimes with the first occurrence of each ID winning and missing runtimes
 * defaulting to `jre-legacy`. IDs and runtime names are sorted lexicographically.
 */
export function createJRTVersionTable(
    profiles: Iterable<{ id: string; javaVersion?: { component: string } }>,
): JRTVersionTable {
    const components = new Map<string, string>();
    for (const profile of profiles) {
        if (!components.has(profile.id)) {
            components.set(profile.id, profile.javaVersion?.component || "jre-legacy");
        }
    }

    const runtimes = [...new Set(components.values())].sort();
    const indices = new Map(runtimes.map((runtime, index) => [runtime, index]));
    const versions = Object.fromEntries(
        [...components.keys()].sort().map(id => [id, indices.get(components.get(id)!)!]),
    );
    return { versions, runtimes };
}
interface JRTVersionTable {
    versions: Record<string, number>;
    runtimes: string[];
}
