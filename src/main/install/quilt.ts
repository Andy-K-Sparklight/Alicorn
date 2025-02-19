import type { Container } from "@/main/container/spec";
import { netx } from "@/main/net/netx";
import { exceptions } from "@/main/util/exception";
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
        const res = await netx.get(url);
        if (!res.ok) throw exceptions.create("network", { url, code: res.status });
        availableGameVersions = (await res.json()).map((v: { version: string }) => v.version);
    }

    return availableGameVersions;
}

async function queryLoaderVersions(gameVersion: string): Promise<QuiltLoaderVersion[]> {
    const url = QUILT_META_API + `/versions/loader/${gameVersion}`;

    const res = await netx.get(url);
    if (!res.ok) throw exceptions.create("network", { url, code: res.status });

    const entries = await res.json() as LoaderEntry[];
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
        if (!sv) throw exceptions.create("quilt-no-version", { gameVersion });

        loaderVersion = sv;
    }

    console.debug(`Fetching Quilt profile for ${gameVersion} / ${loaderVersion}`);
    const url = QUILT_META_API + `/versions/loader/${gameVersion}/${loaderVersion}/profile/json`;

    controller?.signal?.throwIfAborted();

    const res = await netx.get(url);
    if (!res.ok) throw exceptions.create("network", { url, code: res.status });

    const fbp = await res.json();
    if (!("id" in fbp) || typeof fbp.id !== "string") throw exceptions.create("quilt-no-version", { gameVersion });

    console.debug(`Writing profile with ID: ${fbp.id}`);
    await fs.outputJSON(container.profile(fbp.id), fbp);

    return fbp.id;
}

export const quiltInstaller = {
    queryLoaderVersions,
    getAvailableGameVersions,
    retrieveProfile
};
