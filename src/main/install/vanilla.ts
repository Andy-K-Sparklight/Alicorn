import { netx } from "@/main/net/netx";
import { is } from "typia";

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

async function getManifest(): Promise<VersionManifest> {
    if (!versionManifest) {
        const r = await netx.get(VERSION_MANIFEST);
        if (!r.ok) throw `Unable to get version manifest: ${r.status}`;
        const d = await r.json();
        if (!is<VersionManifest>(d)) throw `Malformed version manifest received, skipping.`;
        versionManifest = d;
    }

    return versionManifest;
}

export const vanillaInstaller = {
    getManifest
};