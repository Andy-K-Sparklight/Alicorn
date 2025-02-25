import type { Container } from "@/main/container/spec";
import type { Library } from "@/main/profile/version-profile";
import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import path from "node:path";

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


export const smeltLegacy = { dumpContent };
