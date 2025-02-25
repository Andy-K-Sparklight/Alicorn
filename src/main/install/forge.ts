import { paths } from "@/main/fs/paths";
import { dlx } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { exceptions } from "@/main/util/exception";
import { progress, type ProgressController } from "@/main/util/progress";
import { XMLParser } from "fast-xml-parser";
import * as semver from "semver";

const FORGE_VERSIONS = "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml";

let versions: string[] | null = null;

async function syncVersions(): Promise<string[]> {
    if (!versions) {
        const res = await netx.get(FORGE_VERSIONS);
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

    const g = semver.valid(gameVersion);

    if (!g) return [];

    const versions = await syncVersions();

    // Versions of Forge are named in the format `<gameVersion>-<suffix>`
    // This is a guess based on existing versions, yet players are expected to move to NeoForged anyway
    // This method is not prone to changes
    return versions.filter(v => v.startsWith(g));
}

function genInstallerUrl(loaderVersion: string): string {
    return `https://maven.minecraftforge.net/net/minecraftforge/forge/${loaderVersion}/forge-${loaderVersion}-installer.jar`;
}

async function pickLoaderVersion(gameVersion: string, control?: ProgressController): Promise<string> {
    const versions = await queryLoaderVersions(gameVersion, control);
    if (versions.length === 0) throw exceptions.create("forge-no-version", { gameVersion });
    return versions[0];
}

async function downloadInstaller(loaderVersion: string, control?: ProgressController): Promise<string> {
    control?.onProgress?.(progress.indefinite("forge.download"));

    console.debug(`Fetching Forge installer ${loaderVersion}`);

    const fp = paths.temp.to(`forge-${loaderVersion}.jar`);
    await dlx.getAll([
        {
            url: genInstallerUrl(loaderVersion),
            path: fp
        }
    ]);

    return fp;
}

export const forgeInstaller = { queryLoaderVersions, pickLoaderVersion, downloadInstaller };
