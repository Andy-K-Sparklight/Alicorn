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
import { zip } from "zip-a-folder";

async function dumpContent(installer: string, container: Container): Promise<string> {
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

            return ip.versionInfo.id;
        }
    } finally {
        await zip?.close();
    }

    return "";
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

async function findLibraries(jrtExec: string, jarPath: string): Promise<string[]> {
    const proc = child_process.spawn(
        jrtExec,
        [
            "-cp",
            [paths.app.to("vendor", "ffind.jar"), jarPath].join(path.delimiter),
            "moe.skjsjhb.ffind.Main"
        ]
    );

    let output = "";

    proc.stdout.on("data", d => {
        output += String(d);
    });

    await pEvent(proc, "exit");

    const libs = output.split("\n").map(it => it.trim()).filter(it => it.endsWith(".jar"));
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

async function patchLegacyLibraries(jrtExec: string, jarPath: string, container: Container, control?: ProgressController): Promise<void> {
    const rawLibs = await findLibraries(jrtExec, jarPath);
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

async function mergeClient(src: string, fp: string): Promise<void> {
    console.debug(`Merging client: ${src} -> ${fp}`);

    const workDir = paths.temp.to(`forge-merge-${nanoid()}`);
    await fs.emptyDir(workDir);

    const targetZip = new StreamZip.async({ file: fp });
    try {
        await targetZip.extract(null, workDir);
    } finally {
        await targetZip.close();
    }

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

    await fs.remove(path.join(workDir, "META-INF")); // Drop signatures
    await fs.remove(fp);
    await zip(workDir, fp);
    await fs.remove(workDir);
}

export const smeltLegacy = { dumpContent, mergeClient, patchLegacyLibraries };
