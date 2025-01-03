import fs from "fs-extra";
import { Writable } from "stream";
import path from "path";
import consola from "consola";
import type { BuildConfig } from "~/config";

interface VendorFile {
    url: string;
    target: string;
}

const contents = {
    aria2c: {
        url: "https://files.catbox.moe/61p0gr.zip",
        target: "aria2c.exe"
    }
};

const vendorFilesVersion = "1";

const vendorCacheDir = path.join(import.meta.dirname, "..", "vendor", "cache", vendorFilesVersion);
const vendorActiveDir = path.join(import.meta.dirname, "..", "vendor", "active");

function createFileList(cfg: BuildConfig): VendorFile[] {
    const { variant: { platform, arch } } = cfg;

    const hasBundledAria2 = platform === "win32" && arch === "x64";

    return [
        cfg.enableBundledAria2 && hasBundledAria2 && contents.aria2c
    ].filter(Boolean) as VendorFile[];
}

async function getFile(url: string, target: string) {
    try {
        await fs.access(target, fs.constants.F_OK);
        consola.success(`Hit: ${url} -> ${target}`);
        return;
    } catch {}

    consola.start(`Get: ${url} -> ${target}`);
    const res = await fetch(url);
    if (!res.ok) throw `Unable to fetch ${url}`;

    await fs.ensureDir(path.dirname(target));

    await res.body?.pipeTo(Writable.toWeb(fs.createWriteStream(target)));
    consola.success(`Got: ${url} -> ${target}`);
}

async function prepareAssets(cfg: BuildConfig, outDir: string): Promise<void> {
    const files = createFileList(cfg);
    await fs.emptyDir(vendorActiveDir);
    await Promise.all(files.map(async f => {
        const dlPath = path.join(vendorCacheDir, f.target);
        const outPath = path.join(vendorActiveDir, f.target);
        await getFile(f.url, dlPath);
        await fs.ensureDir(path.dirname(outPath));
        await fs.copy(dlPath, outPath);
    }));

    await fs.copy(vendorActiveDir, outDir);
}

export const vendor = { prepareAssets };