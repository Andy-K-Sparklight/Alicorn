import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import type { Library } from "@/main/profile/version-profile";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import StreamZip from "node-stream-zip";
import path from "node:path";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";

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
            lib.url = "https://libraries.minecraft.net";
        }
    }
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
    await zip(workDir, fp, { compression: COMPRESSION_LEVEL.uncompressed });
    await fs.remove(workDir);
}

export const smeltLegacy = { dumpContent, mergeClient };
