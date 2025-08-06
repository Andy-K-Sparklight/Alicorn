import fs from "fs-extra";
import path from "node:path";

async function fetchJSON(url: string): Promise<unknown> {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw `Failed to fetch ${url}: ${res.status}`;
    return await res.json();
}

interface VersionManifest {
    versions: { id: string; complianceLevel: number, url: string }[];
}

interface VersionProfile {
    id: string;
    assets: string;
    minecraftArguments?: string[];
    javaVersion: {
        component: string;
        majorVersion: number;
    };
}

let versionManifest: VersionManifest;
let profiles: VersionProfile[];

async function createLegacyAssetsRef() {
    const legacyAssets = new Set<string>();
    for (const p of profiles) {
        if (p.minecraftArguments?.includes("${game_assets}")) {
            legacyAssets.add(p.assets);
        }
    }

    const data = [...legacyAssets.values()];
    await fs.outputJSON(path.resolve(import.meta.dirname, "../src/refs/legacy-assets.json"), data, { spaces: 4 });
}

async function createJRTVersionRef() {
    const out: Record<string, string[]> = {}; // Maps the component to profile ID for compact storage
    for (const p of profiles) {
        const c = p.javaVersion?.component || "jre-legacy";
        let arr = out[c];
        if (!arr) {
            arr = [];
            out[c] = arr;
        }

        arr.push(p.id);
    }

    await fs.outputJSON(path.resolve(import.meta.dirname, "../src/refs/jrt-versions.json"), out, { spaces: 4 });
}

async function main() {
    console.log("Fetching versions...");
    versionManifest = await fetchJSON("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json") as VersionManifest;
    profiles = await Promise.all(versionManifest.versions.map(v => fetchJSON(v.url))) as VersionProfile[];

    console.log("Collecting legacy assets...");
    await createLegacyAssetsRef();

    console.log("Collecting JRT versions...");
    await createJRTVersionRef();

    console.log("Compatibility tables generated.");
}

void main();
