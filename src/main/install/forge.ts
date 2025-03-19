import { NetRequestFailedException } from "@/main/except/net";
import { paths } from "@/main/fs/paths";
import { UnavailableModLoaderException } from "@/main/install/except";
import { dlx } from "@/main/net/dlx";
import { mirror } from "@/main/net/mirrors";
import { netx } from "@/main/net/netx";
import { isTruthy } from "@/main/util/misc";
import { progress, type ProgressController } from "@/main/util/progress";
import { XMLParser } from "fast-xml-parser";

const FORGE_VERSIONS = "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml";

let versions: string[] | null = null;

interface BMCLAPIForgeVersion {
    version: string;
    mcversion: string;
    branch: string;
}

async function syncVersionFromBMCLAPI(): Promise<string[]> {
    console.debug("Requesting Forge version info from BMCLAPI...");

    const vs: string[] = [];

    let offset = 0;
    while (true) {
        const results = await netx.json(`https://bmclapi2.bangbang93.com/forge/list/${offset}/500`) as BMCLAPIForgeVersion[];
        const rv = results.map(r => [r.mcversion, r.version, r.branch].filter(isTruthy).join("-"));
        vs.push(...rv);

        if (rv.length < 500) break;
        offset += 500;
    }

    return vs.toReversed();
}

async function syncVersions(): Promise<string[]> {
    if (!versions) {
        if (mirror.isMirrorEnabled("bmclapi")) {
            try {
                versions = await syncVersionFromBMCLAPI();
                return versions;
            } catch (e) {
                console.error(`Unable to sync Forge versions from BMCLAPI: ${e}`);
            }
        }

        const res = await netx.request(FORGE_VERSIONS);

        if (!res.ok) throw new NetRequestFailedException(FORGE_VERSIONS, res.status);

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
    if (versions.length === 0) throw new UnavailableModLoaderException(gameVersion);
    return versions[0];
}

async function coerceLoaderVersion(loaderVersion: string): Promise<string> {
    const versions = await syncVersions();

    if (versions.includes(loaderVersion)) return loaderVersion;

    // Allow to omit game version in version specifier
    return versions.find(v => v.split("-")[1] === loaderVersion) ?? loaderVersion;
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
            path: fp,
            noCache: true
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
    prefetch,
    coerceLoaderVersion
};
