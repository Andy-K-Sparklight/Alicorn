import { paths } from "@/main/fs/paths";
import { dlx } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { exceptions } from "@/main/util/exception";
import { progress, type ProgressController } from "@/main/util/progress";
import { XMLParser } from "fast-xml-parser";

const FORGE_VERSIONS = "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml";

let versions: string[] | null = null;

async function syncVersions(): Promise<string[]> {
    if (!versions) {
        const res = await netx.get(FORGE_VERSIONS);

        if (!res.ok) throw exceptions.create("network", { url: res.url });

        const xml = await res.text();
        const parser = new XMLParser();
        const doc = parser.parse(xml);
        const arr = doc?.metadata?.versioning?.versions?.version;

        if (Array.isArray(arr)) {
            versions = arr;
        } else {
            throw "Malformed Forge version metadata";
        }
    }

    return versions;
}

async function queryLoaderVersions(gameVersion: string, control?: ProgressController): Promise<string[]> {
    control?.onProgress?.(progress.indefinite("forge.download"));

    // This is the only except in versioning
    if (gameVersion === "1.4") {
        gameVersion = "1.4.0";
    }

    const versions = await syncVersions();

    // Versions of Forge are named in the format `<gameVersion>-<suffix>`
    // This is a guess based on existing versions, yet players are expected to move to NeoForged anyway
    // This method is not prone to changes
    return versions.filter(v => v.split("-")[0] === gameVersion);
}

function genInstallerUrl(loaderVersion: string): string {
    return `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-installer.jar`;
}

function genUniversalUrl(loaderVersion: string): string {
    return `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-universal.zip`;
}

function genClientUrl(loaderVersion: string): string {
    return `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-client.zip`;
}

async function pickLoaderVersion(gameVersion: string, control?: ProgressController): Promise<string> {
    const versions = await queryLoaderVersions(gameVersion, control);
    if (versions.length === 0) throw exceptions.create("forge-no-version", { gameVersion });
    return versions[0];
}

async function downloadInstaller(loaderVersion: string, type: "installer" | "universal" | "client", control?: ProgressController): Promise<string> {
    control?.onProgress?.(progress.indefinite("forge.download"));

    console.debug(`Fetching Forge installer ${loaderVersion}`);

    let url: string;
    switch (type) {
        case "installer":
            url = genInstallerUrl(loaderVersion);
            break;
        case "universal":
            url = genUniversalUrl(loaderVersion);
            break;
        case "client":
            url = genClientUrl(loaderVersion);
            break;
    }

    const fp = paths.temp.to(`forge-${loaderVersion}.jar`);
    await dlx.getAll([
        {
            url,
            path: fp
        }
    ], { signal: control?.signal });

    return fp;
}


function getInstallType(gameVersion: string): "installer" | "universal" | "client" {
    const [major, minor, patch] = gameVersion.split(".");
    if (!minor || major !== "1") return "installer";

    const mv = parseInt(minor, 10);

    if (mv >= 3 && mv < 5 || mv === 5 && patch !== "2") { // 1.3.x, 1.4.x, 1.5.x excluding 1.5.2
        return "universal";
    }

    if (mv < 3) {
        return "client";
    }

    return "installer";
}

async function prefetch() {
    try {
        await syncVersions();
    } catch {}
}

export const forgeInstaller = {
    queryLoaderVersions,
    pickLoaderVersion,
    getInstallType,
    downloadInstaller,
    prefetch
};
