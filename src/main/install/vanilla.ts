import { cache } from "@/main/cache/cache";
import type { Container } from "@/main/container/spec";
import { nativesLint } from "@/main/install/natives-lint";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { profileLoader } from "@/main/profile/loader";
import { nativeLib } from "@/main/profile/native-lib";
import { filterRules } from "@/main/profile/rules";
import type { AssetIndex, VersionProfile } from "@/main/profile/version-profile";
import { i18nMain } from "@/main/util/i18n";
import { progress, type ProgressController, type ProgressHandler } from "@/main/util/progress";
import fs from "fs-extra";
import path from "node:path";

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
async function installProfile(id: string | "latest-release" | "latest-snapshot", container: Container, control?: ProgressController): Promise<VersionProfile> {
    control?.onProgress?.(progress.indefinite("vanilla.resolve"));

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

    await dlx.getAll([{ ...v, path: fp }], { signal: control?.signal });

    // Profiles are not linked as they may frequently get modified

    return await profileLoader.fromContainer(id, container);
}

/**
 * Downloads and installs libraries. Unpacks them if necessary.
 */
async function installLibraries(
    profile: VersionProfile,
    container: Container,
    features: Set<string>,
    control?: ProgressController
) {
    const { signal, onProgress } = control ?? {};
    const usableLibraries = profile.libraries.filter(lib => filterRules(lib.rules, features));
    const tasks: DlxDownloadRequest[] = [];
    const shouldLink = container.props.flags.link;

    for (const lib of usableLibraries) {
        if (nativeLib.isNative(lib)) {
            const name = nativeLib.getArtifactName(lib);
            const a = nativeLib.getArtifact(lib);
            if (name && a && a.url) {
                const fp = container.nativeLibrary(lib.name, name);
                tasks.push({
                    ...a,
                    url: a.url, // A workaround for TS type system
                    path: fp,
                    fastLink: shouldLink
                });
            }
        }

        if (lib.downloads?.artifact) {
            const a = lib.downloads.artifact;
            if (a.url) {
                const fp = container.library(lib.name);
                tasks.push({
                    ...a,
                    url: a.url,
                    path: fp,
                    fastLink: shouldLink
                });
            }
        }
    }

    // Add client file
    const ca = profile.downloads.client;
    const clientPath = container.client(profile.id);

    tasks.push({
        ...ca,
        path: clientPath,
        fastLink: shouldLink
    });

    // Add logging config
    const logging = profile.logging?.client?.file;
    if (logging) {
        tasks.push({
            ...logging,
            path: container.loggingConfig(logging.id)
        });
    }

    signal?.throwIfAborted();

    console.debug(`Library artifacts counted: ${tasks.length}`);

    if (import.meta.env.AL_TEST) return; // Skips download

    await dlx.getAll(tasks, { signal, onProgress: progress.makeNamed(onProgress, "vanilla.download-libs") });

    if (shouldLink) {
        await linkTasks(tasks, onProgress);
    }

    onProgress?.(progress.indefinite("vanilla.unpack-libs"));

    await nativesLint.unpack(profile, container, features);
}

const ASSETS_BASE_URL = "https://resources.download.minecraft.net";

/**
 * Installs assets and asset index.
 *
 * This function accepts a parameter (`level`) that controls files that should be downloaded.
 * For regular installs, `full` is used to get the full game experience.
 * For users with such requests, `video-only` can be used to omit audio files, which saves space and speeds up the
 * installation.
 */
async function installAssets(
    profile: VersionProfile,
    container: Container,
    level: "full" | "video-only",
    control?: ProgressController
): Promise<void> {
    const { signal, onProgress } = control ?? {};

    onProgress?.(progress.indefinite("vanilla.download-asset-index"));

    const assetIndexPath = container.assetIndex(profile.assetIndex.id);

    const shouldLink = container.props.flags.link;

    await dlx.getAll([{
        ...profile.assetIndex,
        path: assetIndexPath,
        fastLink: shouldLink
    }], { signal });

    const assetIndex = await fs.readJSON(assetIndexPath) as AssetIndex;

    const objects = Object.entries(assetIndex.objects).filter(([name]) => {
        if (level === "video-only") {
            // Filter out audio files
            return !name.toLowerCase().endsWith(".ogg");
        }
        return true;
    });

    console.debug(`Fetching ${objects.length} assets...`);

    const tasks: DlxDownloadRequest[] = objects.map(([, { hash, size }]) => (
        {
            url: `${ASSETS_BASE_URL}/${hash.slice(0, 2)}/${hash}`,
            path: container.asset(hash),
            sha1: hash,
            size,
            fastLink: shouldLink
        }
    ));

    if (import.meta.env.AL_TEST) return; // Skips download

    await dlx.getAll(tasks, { signal, onProgress: progress.makeNamed(onProgress, "vanilla.download-assets") });

    if (shouldLink) {
        await linkTasks(tasks, onProgress);
    }

    console.debug(`Linking ${objects.length} assets...`);

    await Promise.all(progress.countPromises(
        objects.map(async ([name, { hash }]) => {
            const src = container.asset(hash);
            const dst = container.assetLegacy(profile.assetIndex.id, name);
            await makeAssetLink(src, dst);

            if (assetIndex.map_to_resources) {
                // Also link to the resources dir
                const dst = container.assetMapped(name);
                await makeAssetLink(src, dst);
            }
        }),
        progress.makeNamed(onProgress, "vanilla.link-assets")
    ));
}

/**
 * Emits initial options for better user experience.
 */
async function emitOptions(container: Container) {
    const fp = container.options();

    try {
        await fs.access(fp);
        return;
    } catch {
    }

    const values = {
        lang: i18nMain.language.replaceAll("-", "_").toLowerCase()
    };

    const out = Object.entries(values).map(([k, v]) => `${k}:${v}`).join("\n");
    await fs.outputFile(fp, out);
}

/**
 * Link game assets for legacy versions. Assets are always linked regardless of the `link` flag.
 */
async function makeAssetLink(src: string, dst: string) {
    await fs.ensureDir(path.dirname(dst));
    await fs.remove(dst); // This is required for updating links
    await fs.link(src, dst);
    console.debug(`Linking asset ${src} -> ${dst}`);
}

/**
 * Utility function to link all downloaded files from the task set.
 */
async function linkTasks(tasks: DlxDownloadRequest[], onProgress?: ProgressHandler): Promise<void> {
    await Promise.all(progress.countPromises(
        tasks.map(t => cache.link(t.path, t.sha1)),
        progress.makeNamed(onProgress, "cache.compact-link")
    ));
}

export const vanillaInstaller = {
    getManifest, prefetch, installProfile, installLibraries, installAssets, emitOptions
};
