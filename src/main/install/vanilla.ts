import { clinker } from "@/main/container/linker";
import type { Container } from "@/main/container/spec";
import { nativesLint } from "@/main/install/natives-lint";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { profileLoader } from "@/main/profile/loader";
import { nativeLib } from "@/main/profile/native-lib";
import { filterRules } from "@/main/profile/rules";
import type { VersionProfile } from "@/main/profile/version-profile";
import { progress, type ProgressController } from "@/main/util/progress";

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

/**
 * Downloads and installs libraries. Unpacks them if necessary.
 */
async function installLibraries(profile: VersionProfile, container: Container, features: Set<string>, control?: ProgressController) {
    const { signal, onProgress } = control ?? {};
    const usableLibraries = profile.libraries.filter(lib => filterRules(lib.rules, features));
    const tasks: DlxDownloadRequest[] = [];

    for (const lib of usableLibraries) {
        if (nativeLib.isNative(lib)) {
            const name = nativeLib.getArtifactName(lib);
            const a = nativeLib.getArtifact(lib);
            if (name && a && a.url) {
                const fp = container.nativeLibrary(lib.name, name);
                tasks.push({
                    url: a.url,
                    path: fp,
                    sha1: a.sha1,
                    size: a.size
                });
            }
        }

        if (lib.downloads?.artifact) {
            const a = lib.downloads.artifact;
            if (a.url) {
                const fp = container.library(lib.name);
                tasks.push({
                    url: a.url,
                    path: fp,
                    sha1: a.sha1,
                    size: a.size
                });
            }
        }
    }

    const ca = profile.downloads.client;
    const clientPath = container.client(profile.id);

    tasks.push({
        ...ca,
        path: clientPath
    });

    signal?.throwIfAborted();

    console.debug(`Library artifacts counted: ${tasks.length}`);

    await dlx.getAll(tasks, { signal, onProgress: progress.makeNamed(onProgress, "vanilla.download-libs") });


    if (container.spec.flags.link) {
        await Promise.all(tasks.map(async t => {
            await clinker.link(t.path, t.sha1);
        }));
    }

    onProgress?.({
        state: "vanilla.unpack-libs",
        type: "indefinite",
        value: {
            current: 0,
            total: 0
        }
    });

    await nativesLint.unpack(profile, container, features);
}

export const vanillaInstaller = {
    getManifest, prefetch, installProfile, installLibraries
};
