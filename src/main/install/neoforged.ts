import { paths } from "@/main/fs/paths";
import { dlx } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { exceptions } from "@/main/util/exception";
import { progress, type ProgressController } from "@/main/util/progress";

const NEOFORGED_API = "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge";

let versions: string[] | null = null;

async function syncVersions(): Promise<string[]> {
    if (!versions) {
        versions = (await netx.getJSON(NEOFORGED_API)).versions as string[];
    }

    return versions;
}

async function queryLoaderVersions(gameVersion: string, control?: ProgressController): Promise<string[]> {
    control?.onProgress?.(progress.indefinite("neoforged.resolve"));

    const [, minor, patch] = gameVersion.split(".");

    const versions = await syncVersions();

    // NeoForged does not provide an API to query loader version for specific game
    // They name the releases using the `<minor>.<patch>` format so we'll parse it based on that
    return versions.filter(v => {
        const sv = v.split(".");
        return sv[0] === (minor ?? "0") && sv[1] === (patch ?? "0");
    });
}

async function pickLoaderVersion(gameVersion: string, control?: ProgressController): Promise<string> {
    const versions = await queryLoaderVersions(gameVersion, control);
    if (versions.length === 0) throw exceptions.create("neoforged-no-version", { gameVersion });
    return versions[versions.length - 1];
}

function genInstallerUrl(loaderVersion: string) {
    return `https://maven.neoforged.net/releases/net/neoforged/neoforge/${loaderVersion}/neoforge-${loaderVersion}-installer.jar`;
}

async function downloadInstaller(loaderVersion: string, control?: ProgressController): Promise<string> {
    control?.onProgress?.(progress.indefinite("neoforged.download"));

    console.debug(`Fetching NeoForged installer ${loaderVersion}`);

    const fp = paths.temp.to(`neoforged-${loaderVersion}.jar`);
    await dlx.getAll([
        {
            url: genInstallerUrl(loaderVersion),
            path: fp
        }
    ], { signal: control?.signal });

    return fp;
}

export const neoforgedInstaller = {
    queryLoaderVersions,
    pickLoaderVersion,
    downloadInstaller
};
