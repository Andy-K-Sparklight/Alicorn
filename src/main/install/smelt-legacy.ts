import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import type { Library } from "@/main/profile/version-profile";
import { unwrapESM } from "@/main/util/module";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import StreamZip from "node-stream-zip";
import child_process from "node:child_process";
import path from "node:path";
import { pEvent } from "p-event";

async function dumpContent(installer: string, container: Container): Promise<[string, string] | null> {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: installer });
        const dat = await zip.entryData("install_profile.json");
        const ip = JSON.parse(dat.toString());
        const isLegacy = !!ip?.versionInfo;
        if (isLegacy) {
            // Extract universal jar
            const jarName = ip.install.filePath;
            const libName = ip.install.path; // Weird naming convention of Forge...
            const fp = container.library(libName);
            console.debug(`Unpacking ${jarName}`);
            await fs.ensureDir(path.dirname(fp));
            await zip.extract(jarName, fp);

            // Dump version profile
            filterLibraries(ip.versionInfo.libraries, libName);

            if (!ip.versionInfo.inheritsFrom) {
                ip.versionInfo.inheritsFrom = ip.install.minecraft;
            }

            console.debug(`Writing profile to ${ip.versionInfo.id}`);
            await fs.outputJSON(container.profile(ip.versionInfo.id), ip.versionInfo, { spaces: 2 });

            return [ip.versionInfo.id, fp];
        }
    } finally {
        await zip?.close();
    }

    return null;
}

function filterLibraries(libs: Library[], libName: string) {
    for (const lib of libs) {
        if (lib.name === libName) {
            lib.url = ""; // Drop the URL to prevent downloading universal jar
        } else if (!lib.url) {
            // This is implicitly defined only in Forge
            lib.url = "https://libraries.minecraft.net/";
        }
    }
}

async function findLibraries(jrtExec: string, jarPath: string, gameVersion: string): Promise<string[]> {
    const proc = child_process.spawn(
        jrtExec,
        [
            `-Dffind.mcv=${gameVersion}`,
            "-cp",
            [paths.app.to("vendor", "ffind-1.2.jar"), jarPath].join(path.delimiter),
            "moe.skjsjhb.ffind.Main"
        ]
    );

    let output = "";

    proc.stdout.on("data", d => {
        output += String(d);
    });

    await pEvent(proc, "exit");

    const libs = output.split("\n").map(it => it.trim()).filter(it => it.endsWith(".jar") || it.endsWith(".zip"));
    console.debug(`Detected libraries of ${jarPath}: ${libs}`);

    return libs;
}

async function mapLibraries(libs: string[]): Promise<[string, string][]> {
    const libMap = await unwrapESM(import("@/refs/legacy-forge-libs.json")) as unknown as Record<string, string>;
    const out: [string, string][] = [];

    for (const lib of libs) {
        const url = libMap[lib];
        if (!url) {
            throw `Unsupported library: ${lib}`;
        }

        out.push([url, lib]);
    }

    return out;
}

async function patchLegacyLibraries(jrtExec: string, jarPath: string, gameVersion: string, container: Container, control?: ProgressController): Promise<void> {
    const rawLibs = await findLibraries(jrtExec, jarPath, gameVersion);
    const libs = await mapLibraries(rawLibs);

    const tasks: DlxDownloadRequest[] = libs.map(([url, lib]) => ({
        url,
        path: path.join(container.gameDir(), "lib", lib)
    }));

    await dlx.getAll(tasks, {
        signal: control?.signal,
        onProgress: progress.makeNamed(control?.onProgress, "forge-install.download-libraries")
    });
}

async function updateJar(fp: string, ...sources: string[]) {
    const workDir = paths.temp.to(`forge-merge-${nanoid()}`);
    await fs.emptyDir(workDir);

    for (const src of [fp, ...sources]) {
        console.debug(`Unpacking ${src}`);
        const srcZip = new StreamZip.async({ file: src });
        try {
            const entries = Object.values(await srcZip.entries()).filter(e => e.isFile);

            for (const ent of entries) {
                const t = path.join(workDir, ent.name);
                await fs.ensureDir(path.dirname(t));
                await fs.remove(t);
                await srcZip.extract(ent, t);
            }
        } finally {
            await srcZip.close();
        }
    }

    console.debug(`Rebuilding ${fp}`);
    await fs.remove(path.join(workDir, "META-INF")); // Drop signatures
    await fs.remove(fp);

    const { zip } = await import("zip-a-folder");

    // ModLoader requires that the client jar is compressed using DEFLATE
    // We're passing level 1 to minimum the compression time
    // This is not documented in zip-a-folder while it works
    await zip(workDir, fp, { compression: 1 as any });
    await fs.remove(workDir);
}

export const smeltLegacy = { dumpContent, updateJar, patchLegacyLibraries };
