import type { Container } from "@/main/container/spec";
import { netx } from "@/main/net/netx";
import { exceptions } from "@/main/util/exception";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";

const FABRIC_META_API = "https://meta.fabricmc.net/v2";

interface LoaderEntry {
    loader: FabricLoaderVersion;
}

interface FabricLoaderVersion {
    version: string;
    stable: boolean;
}

let availableGameVersions: string[];

async function getAvailableGameVersions() {
    if (!availableGameVersions) {
        const url = FABRIC_META_API + "/versions/game";
        const vs = await netx.getJSON(url);
        availableGameVersions = vs.map((v: { version: string }) => v.version);
    }

    return availableGameVersions;
}

async function queryLoaderVersions(gameVersion: string): Promise<FabricLoaderVersion[]> {
    const url = FABRIC_META_API + `/versions/loader/${gameVersion}`;

    const entries = await netx.getJSON(url) as LoaderEntry[];
    return entries.map(e => e.loader);
}

async function retrieveProfile(
    gameVersion: string,
    loaderVersion: string,
    container: Container,
    controller?: ProgressController
): Promise<string> {
    controller?.onProgress?.(progress.indefinite("fabric.resolve"));

    if (!loaderVersion) {
        const versions = await queryLoaderVersions(gameVersion);
        let sv = versions.find(v => v.stable)?.version;
        if (!sv) {
            // There are no stable versions, use the first one instead
            sv = versions[0]?.version;
        }
        if (!sv) throw exceptions.create("fabric-no-version", { gameVersion });

        loaderVersion = sv;
    }

    console.debug(`Fetching Fabric profile for ${gameVersion} / ${loaderVersion}`);
    const url = FABRIC_META_API + `/versions/loader/${gameVersion}/${loaderVersion}/profile/json`;

    controller?.signal?.throwIfAborted();

    const fbp = await netx.getJSON(url);
    if (!("id" in fbp) || typeof fbp.id !== "string") throw exceptions.create("fabric-no-version", { gameVersion });

    console.debug(`Writing profile with ID: ${fbp.id}`);
    await fs.outputJSON(container.profile(fbp.id), fbp);

    return fbp.id;
}

export const fabricInstaller = {
    queryLoaderVersions,
    getAvailableGameVersions,
    retrieveProfile
};
