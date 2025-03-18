import { curseModpack } from "@/main/modpack/curse";
import { modrinthModpack } from "@/main/modpack/modrinth";
import StreamZip from "node-stream-zip";

export interface ModpackMetaSlim {
    name: string;
    author: string;
    gameVersion: string;
    version: string;
}

async function loadPackMeta(fp: string): Promise<ModpackMetaSlim | null> {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: fp });
        const entries = Object.keys(await zip.entries());

        if (entries.includes("manifest.json")) {
            // Curseforge
            return await curseModpack.readMetadata(zip);
        }

        if (entries.includes("modrinth.index.json")) {
            // Modrinth
            return await modrinthModpack.readMetadata(zip);
        }

    } finally {
        zip?.close();
    }

    return null;
}

async function deploy(fp: string): Promise<void> {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: fp });
        const entries = Object.keys(await zip.entries());

        if (entries.includes("manifest.json")) {
            // Curseforge
            await curseModpack.deploy(fp);
        }

        if (entries.includes("modrinth.index.json")) {
            // Modrinth
            await modrinthModpack.deploy(fp);
        }

    } finally {
        zip?.close();
    }
}

export const modpacks = { loadPackMeta, deploy };
