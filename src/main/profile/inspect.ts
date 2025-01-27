import { MavenName } from "@/main/profile/maven-name";
import type { VersionProfile } from "@/main/profile/version-profile";

export interface VersionProfileSummary {
    /**
     * Profile unique ID.
     */
    id: string;

    /**
     * Main game version.
     */
    gameVersion: string;

    /**
     * Mod loader type of the client.
     * Value 'unknown' indicates no known loader.
     * This field is empty for vanilla profiles.
     */
    modLoader: string;
}

/**
 * Detects the possible mod loader of the given profile.
 *
 * TODO add support for other less-popular loaders.
 */
function detectModLoader(p: VersionProfile): string {
    if (p.mainClass === "org.quiltmc.loader.impl.launch.knot.KnotClient") {
        return "quilt";
    }

    if (p.mainClass === "net.fabricmc.loader.impl.launch.knot.KnotClient") {
        return "fabric";
    }

    const libs = new Set(p.libraries.map(lib => {
        const m = new MavenName(lib.name);
        return m.group + ":" + m.artifact;
    }));

    // Recent versions of Forge no longer includes the locally built library 'forge'.
    // We then detect it via 'coremods'.
    if (libs.has("net.minecraftforge:coremods") || libs.has("net.minecraftforge:forge")) {
        return "forge";
    }

    return "";
}

/**
 * Creates summary for the given profile.
 */
function summarize(p: VersionProfile): VersionProfileSummary {
    let ld = detectModLoader(p);
    if (!ld && p.id !== p.version) {
        ld = "unknown";
    }
    return {
        id: p.id,
        gameVersion: p.version || p.id,
        modLoader: ld
    };
}

export const profileInspector = {
    summarize
};
