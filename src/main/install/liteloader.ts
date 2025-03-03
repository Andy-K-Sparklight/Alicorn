import type { Container } from "@/main/container/spec";
import { netx } from "@/main/net/netx";
import { MavenName } from "@/main/profile/maven-name";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";

const LITELOADER_VERSIONS = "https://dl.liteloader.com/versions/versions.json";
const BASE_NAME = "com.mumfrey:liteloader";

interface LiteloaderMeta {
    tweakClass: string;
    libraries: { name: string }[];
    stream: "SNAPSHOT" | "RELEASE";
    file: string;
    version: string;
    timestamp: string;
}


interface VersionGroup {
    snapshots?: {
        "com.mumfrey:liteloader": Record<string, LiteloaderMeta>;
    };

    artefacts?: {
        "com.mumfrey:liteloader": Record<string, LiteloaderMeta>;
    };
}

interface LiteloaderVersionManifest {
    /**
     * Maps game version to a version group.
     */
    versions: Record<string, VersionGroup>;
}

let versionManifest: LiteloaderVersionManifest;

async function prefetch() {
    try {
        await getManifest();
    } catch {}
}

async function getManifest(): Promise<LiteloaderVersionManifest> {
    if (!versionManifest) {
        versionManifest = await netx.getJSON(LITELOADER_VERSIONS) as LiteloaderVersionManifest;
    }

    return versionManifest;
}


async function getAvailableVersions(): Promise<string[]> {
    const manifest = await getManifest();
    return Object.keys(manifest.versions);
}

async function fetchProfile(gameVersion: string, container: Container, control?: ProgressController): Promise<string> {
    control?.onProgress?.(progress.indefinite("liteloader.resolve"));

    const versionGroup = (await getManifest()).versions[gameVersion];
    const metaGroup = versionGroup.artefacts?.["com.mumfrey:liteloader"] ??
        versionGroup.snapshots?.["com.mumfrey:liteloader"];

    const existingArgs = (await fs.readJSON(container.profile(gameVersion))).minecraftArguments;

    const meta = metaGroup && (metaGroup.latest ?? Object.values(metaGroup)[0]);

    if (!meta) throw "No liteloader version found for " + gameVersion;

    console.debug(`Using Liteloader version ${meta.version}`);

    const p = genProfile(meta, gameVersion, existingArgs);
    const fp = container.profile(p.id);

    console.debug("Writing profile with ID: " + p.id);

    await fs.outputJSON(fp, p, { spaces: 2 });

    return p.id;
}

function genProfile(meta: LiteloaderMeta, gameVersion: string, args: string): { id: string } {
    const out: any = {};

    out.id = `liteloader-${gameVersion}`;
    out.releaseTime = new Date(parseInt(meta.timestamp, 10)).toISOString();
    out.time = new Date().toISOString();
    out.type = "release";
    out.minecraftArguments = args + " --tweakClass " + meta.tweakClass;
    out.libraries = meta.libraries.concat();

    if (Array.isArray(out.libraries)) {
        filterLibraries(out.libraries);

        // Liteloader basic jar
        out.libraries.unshift({
            name: BASE_NAME + ":" + meta.version,
            url: "https://dl.liteloader.com/versions/"
        });
    }

    out.mainClass = "net.minecraft.launchwrapper.Launch";
    out.inheritsFrom = gameVersion;

    return out;
}

function filterLibraries(libs: { name: string, url?: string }[]) {
    for (const lib of libs) {
        const mn = new MavenName(lib.name);
        const base = mn.group + ":" + mn.artifact;
        if (base === "net.minecraft:launchwrapper") {
            lib.url = "https://libraries.minecraft.net/";
        } else {
            lib.url = "https://repo1.maven.org/maven2/";
        }
    }
}

export const liteloaderInstaller = { fetchProfile, getAvailableVersions, prefetch };
