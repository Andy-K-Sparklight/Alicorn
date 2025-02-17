import type { Container } from "@/main/container/spec";
import { netx } from "@/main/net/netx";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";

const FABRIC_META_API = "https://meta.fabricmc.net/v2";

interface LoaderEntry {
    loader: FabricLoaderVersion;
}

export interface FabricLoaderVersion {
    version: string;
    stable: boolean;
}

async function queryLoaderVersions(gameVersion: string): Promise<FabricLoaderVersion[]> {
    const url = FABRIC_META_API + `/versions/loader/${gameVersion}`;

    const res = await netx.get(url);
    if (!res.ok) throw `Failed to query versions for ${gameVersion}: ${res.status}`;

    const entries = await res.json() as LoaderEntry[];
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
        const sv = versions.find(v => v.stable)?.version;
        if (!sv) throw `Unable to select Fabric version for ${gameVersion}`;
        loaderVersion = sv;
    }

    console.debug(`Fetching Fabric profile for ${gameVersion} / ${loaderVersion}`);
    const url = FABRIC_META_API + `/versions/loader/${gameVersion}/${loaderVersion}/profile/json`;

    controller?.signal?.throwIfAborted();

    // TODO add progress handler
    const res = await netx.get(url);
    if (!res.ok) throw `Unable to fetch Fabric profile for ${gameVersion} / ${loaderVersion}: ${res.status}`;

    const fbp = await res.json();
    if (!("id" in fbp) || typeof fbp.id !== "string") throw "Malformed Fabric profile received";

    console.debug(`Writing profile with ID: ${fbp.id}`);
    await fs.outputJSON(container.profile(fbp.id), fbp);

    return fbp.id;
}

export const fabricInstaller = {
    queryLoaderVersions,
    retrieveProfile
};
