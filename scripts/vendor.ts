import { isTruthy } from "@/main/util/misc";
import consola from "consola";
import fs from "fs-extra";
import path from "node:path";
import { Writable } from "node:stream";
import type { BuildConfig } from "~/config";

interface VendorFile {
    url: string;
    target: string;
}

const contents = {
    aria2c: {
        "win32-x64": {
            url: "https://files.catbox.moe/61p0gr.zip",
            target: "aria2c.exe"
        },

        "win32-arm64": {
            url: "https://files.catbox.moe/zx4nbv.dat",
            target: "aria2c.exe"
        },

        "linux-x64": {
            url: "https://files.catbox.moe/6wd7vt",
            target: "aria2c"
        }
    },

    certificate: {
        "*": {
            url: "https://curl.se/ca/cacert.pem",
            target: "ca-cert.pem"
        }
    }
} as Record<string, Record<string, VendorFile>>;

const vendorFilesVersion = "1";

const vendorCacheDir = path.join(import.meta.dirname, "..", "vendor", "cache", vendorFilesVersion);
const vendorActiveDir = path.join(import.meta.dirname, "..", "vendor", "active");


function createFileList(cfg: BuildConfig): VendorFile[] {
    const { variant: { platform, arch } } = cfg;

    const platformPair = platform + "-" + arch;

    function getComponent(name: string) {
        return contents[name][platformPair] ?? contents[name]["*"];
    }

    return [
        cfg.enableBundledAria2 && getComponent("aria2c"),
        cfg.enableBundledAria2 && getComponent("certificate")
    ].filter(isTruthy);
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

    await res.body?.pipeTo(Writable.toWeb(fs.createWriteStream(target)) as WritableStream<Uint8Array>);
    consola.success(`Got: ${url} -> ${target}`);
}

async function prepareAssets(cfg: BuildConfig, outDir: string): Promise<void> {
    const files = createFileList(cfg);
    const platformPair = cfg.variant.platform + "-" + cfg.variant.arch;
    const root = path.join(vendorCacheDir, platformPair);
    await fs.emptyDir(vendorActiveDir);
    await Promise.all(files.map(async f => {
        const dlPath = path.join(root, f.target);
        const outPath = path.join(vendorActiveDir, f.target);
        await getFile(f.url, dlPath);
        await fs.ensureDir(path.dirname(outPath));
        await fs.link(dlPath, outPath);
    }));

    await fs.copy(vendorActiveDir, outDir);
}

export const vendor = { prepareAssets };
