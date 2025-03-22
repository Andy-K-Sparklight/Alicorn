import type { Container } from "@/main/container/spec";
import { UnavailableModLoaderException } from "@/main/install/except";
import { netx } from "@/main/net/netx";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";

// Quilt installer works quite similar to Fabric
// We're copy-pasting these code in case Quilt make incompatible changes in the future

const QUILT_META_API = "https://meta.quiltmc.org/v3";

interface LoaderEntry {
    loader: QuiltLoaderVersion;
}

interface QuiltLoaderVersion {
    version: string;
    stable: boolean;
}

let availableGameVersions: string[];

async function getAvailableGameVersions() {
    if (!availableGameVersions) {
        const url = QUILT_META_API + "/versions/game";
        const vs = await netx.json(url);
        availableGameVersions = vs.map((v: { version: string }) => v.version);
    }

    return availableGameVersions;
}

async function queryLoaderVersions(gameVersion: string): Promise<QuiltLoaderVersion[]> {
    const url = QUILT_META_API + `/versions/loader/${gameVersion}`;

    const entries = await netx.json(url) as LoaderEntry[];
    return entries.map(e => e.loader);
}

async function retrieveProfile(
    gameVersion: string,
    loaderVersion: string,
    container: Container,
    controller?: ProgressController
): Promise<string> {
    controller?.onProgress?.(progress.indefinite("quilt.resolve"));

    if (!loaderVersion) {
        const versions = await queryLoaderVersions(gameVersion);
        let sv = versions.find(v => v.stable)?.version;
        if (!sv) {
            // There are no stable versions, use the first one instead
            sv = versions[0]?.version;
        }
        if (!sv) throw new UnavailableModLoaderException(gameVersion);

        loaderVersion = sv;
    }

    console.debug(`Fetching Quilt profile for ${gameVersion} / ${loaderVersion}`);
    const url = QUILT_META_API + `/versions/loader/${gameVersion}/${loaderVersion}/profile/json`;

    controller?.signal?.throwIfAborted();

    const qtp = await netx.json(url);
    if (!("id" in qtp) || typeof qtp.id !== "string") throw new UnavailableModLoaderException(gameVersion);

    console.debug(`Writing profile with ID: ${qtp.id}`);
    await fs.outputJSON(container.profile(qtp.id), qtp);

    return qtp.id;
}

async function prefetch() {
    try {
        await getAvailableGameVersions();
    } catch {
    }
}

export const quiltInstaller = {
    prefetch,
    queryLoaderVersions,
    getAvailableGameVersions,
    retrieveProfile
};
