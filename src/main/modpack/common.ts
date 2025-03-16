import { curseModpack } from "@/main/modpack/curse";
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
            // TODO read for Modrinth
        }

    } finally {
        zip?.close();
    }

    return null;
}

async function deploy(fp: string, accountId: string): Promise<void> {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: fp });
        const entries = Object.keys(await zip.entries());

        if (entries.includes("manifest.json")) {
            // Curseforge
            await curseModpack.deploy(fp, accountId);
        }

        if (entries.includes("modrinth.index.json")) {
            // Modrinth
            // TODO read for Modrinth
        }

    } finally {
        zip?.close();
    }
}

export const modpacks = { loadPackMeta, deploy };
