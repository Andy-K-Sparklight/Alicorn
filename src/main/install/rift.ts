import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { dlx } from "@/main/net/dlx";
import { MavenName } from "@/main/profile/maven-name";
import { unwrapESM } from "@/main/util/module";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import path from "node:path";

async function loadCompat() {
    return await unwrapESM(import("@/refs/rift-compat.json"));
}

async function downloadInstaller(loaderVersion: string, control?: ProgressController): Promise<string> {
    control?.onProgress?.(progress.indefinite("rift.download"));

    if (!loaderVersion) {
        loaderVersion = (await loadCompat()).defaultVersion;
    }

    const url = `https://github.com/DimensionalDevelopment/Rift/releases/download/v${loaderVersion}/Rift-${loaderVersion}.jar`;
    const fp = paths.temp.to(`rift-${loaderVersion}.jar`);

    await dlx.getAll([{ url, path: fp, noCache: true }], { signal: control?.signal });
    return fp;
}

async function deployContents(fp: string, container: Container): Promise<string> {
    let f: StreamZip.StreamZipAsync | null = null;
    try {
        f = new StreamZip.async({ file: fp });
        const dat = await f.entryData("profile.json");
        const p = JSON.parse(dat.toString());

        if (typeof p.id !== "string") throw "Malformed Rift profile";

        if (Array.isArray(p.libraries)) {
            filterLibraries(p.libraries);
            p.libraries.unshift(...(await loadCompat()).libs);

            // Copy the installer as a library
            for (const lib of p.libraries) {
                if (typeof lib === "object" && lib && "name" in lib && typeof lib.name === "string") {
                    const m = new MavenName(lib.name);
                    if (m.group === "org.dimdev" && m.artifact.toLowerCase() === "rift") {
                        const target = container.library(lib.name);
                        console.debug(`Deploying main Rift library to ${target}`);
                        await fs.ensureDir(path.dirname(target));
                        await fs.copyFile(fp, target);
                        break;
                    }
                }
            }
        }

        await fs.outputJSON(container.profile(p.id), p, { spaces: 2 });

        return p.id;
    } finally {
        f?.close();
    }
}

function filterLibraries(libs: unknown[]) {
    for (const lib of libs) {
        if (typeof lib === "object" && lib) {
            if (!("url" in lib)) {
                // @ts-expect-error Patching object
                lib.url = "https://libraries.minecraft.net/";
            } else if (typeof lib.url === "string") {
                // The repo of the original author is now downed and refers to ads site
                // Block it to prevent unwanted access
                if (lib.url === "https://www.dimdev.org/maven/") {
                    delete lib.url;
                    continue;
                }

                const u = URL.parse(lib.url);
                if (!u) continue;

                // Upgrade to HTTPS
                if (u.protocol === "http:") {
                    u.protocol = "https:";
                    lib.url = u.toString();
                }
            }
        }
    }
}

async function isAvailable(gameVersion: string): Promise<boolean> {
    return (await loadCompat()).versions.includes(gameVersion);
}

export const riftInstaller = { downloadInstaller, deployContents, isAvailable };
