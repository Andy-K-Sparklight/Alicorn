import fs from "node:fs/promises";
import path from "node:path";
import { hashFile } from "hasha";
import consola from "consola";
import { outputJSON } from "fs-extra";

interface FileEntry {
    path: string;
    sha1: string;
}

async function collectFiles(root: string, dat: FileEntry[]): Promise<void> {
    const files = await fs.readdir(root, { withFileTypes: true });
    await Promise.allSettled(files.map(async f => {
        const fp = path.join(root, f.name);
        if (f.isFile()) {
            const h = await hashFile(fp, { algorithm: "sha1" });
            dat.push({ path: fp, sha1: h });
            consola.info(`Added file ${fp} with SHA-1 ${h}`);
        } else if (f.isDirectory()) {
            await collectFiles(fp, dat);
        }
    }));
}

async function main() {
    const rootDir = path.join(import.meta.dirname, "../dist/release");
    consola.start(`Collecting files for updating at ${rootDir}`);
    const d: FileEntry[] = [];
    await collectFiles(rootDir, d);

    const pkg = await import("../package.json");

    const summary = {
        date: new Date().getTime(),
        files: d,
        version: pkg.version,
        family: pkg.family
    };

    await outputJSON(path.join(rootDir, ".local/build.summary.json"), summary);
    consola.success("Emitted build summary file.");
}

void main();