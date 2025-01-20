import { clinker } from "@/main/container/linker";
import type { Container } from "@/main/container/spec";
import { dlx } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { profileLoader } from "@/main/profile/loader";
import type { VersionProfile } from "@/main/profile/version-profile";

const VERSION_MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

export interface VersionEntry {
    id: string;
    type: string;
    url: string;
    releaseTime: string;
    sha1: string;
}

export interface VersionManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: VersionEntry[];
}

let versionManifest: VersionManifest;

/**
 * Gets the version manifest object.
 */
async function getManifest(): Promise<VersionManifest> {
    if (!versionManifest) {
        const r = await netx.get(VERSION_MANIFEST);
        if (!r.ok) throw `Unable to get version manifest: ${r.status}`;
        const d = await r.json() as VersionManifest;
        if (!versionManifest) {
            versionManifest = d;
        }
    }

    return versionManifest;
}

/**
 * Prefetches the version manifest to speed up user interaction.
 */
async function prefetch(): Promise<void> {
    try {
        await getManifest();
    } catch {
        // Errors are ignored during prefetch
    }
}

/**
 * Fetches and loads the version manifest of the specified ID.
 */
async function installProfile(id: string | "latest-release" | "latest-snapshot", container: Container): Promise<VersionProfile> {
    const mf = await getManifest();

    if (id === "latest-release") {
        id = mf.latest.release;
    }

    if (id === "latest-snapshot") {
        id = mf.latest.snapshot;
    }

    const v = mf.versions.find(ent => ent.id === id);

    if (!v) throw `No such profile: ${id}`;

    const fp = container.profile(id);

    await dlx.getAll([{ ...v, path: fp }]);

    if (container.spec.flags.link) {
        await clinker.link(fp, v.sha1);
    }

    return await profileLoader.fromContainer(id, container);
}

export const vanillaInstaller = {
    getManifest, prefetch, installProfile
};
