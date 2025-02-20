import { isTruthy } from "@/main/util/misc";
import consola from "consola";
import fs from "fs-extra";
import crypto from "node:crypto";
import path from "node:path";
import { Writable } from "node:stream";
import { pEvent } from "p-event";
import type { BuildConfig } from "~/config";

interface VendorFile {
    url: string;
    target: string;
    sha256: string;
}

const contents = {} as Record<string, Record<string, VendorFile>>;

const vendorCacheDir = path.join(import.meta.dirname, "..", "vendor", "cache");
const vendorActiveDir = path.join(import.meta.dirname, "..", "vendor", "active");

function createFileList(cfg: BuildConfig): VendorFile[] {
    const { variant: { platform, arch } } = cfg;

    const platformPair = platform + "-" + arch;

    function getComponent(name: string) {
        return contents[name][platformPair] ?? contents[name]["*"];
    }

    return [].filter(isTruthy).map(getComponent);
}

async function getFile(url: string, target: string, sha256: string) {
    try {
        await fs.access(target, fs.constants.F_OK);
        if (await checkSha256(target, sha256)) {
            return;
        }
    } catch {}

    consola.start(`vendor: fetching ${url} -> ${target}`);
    const res = await fetch(url);
    if (!res.ok) throw `Unable to fetch ${url}`;

    await fs.ensureDir(path.dirname(target));

    await res.body?.pipeTo(Writable.toWeb(fs.createWriteStream(target)) as WritableStream<Uint8Array>);

    if (!await checkSha256(target, sha256)) {
        throw `Hash mismatch: ${target} (expected ${sha256})`;
    }
}

async function prepareAssets(cfg: BuildConfig, outDir: string): Promise<void> {
    const files = createFileList(cfg);
    const platformPair = cfg.variant.platform + "-" + cfg.variant.arch;
    const root = path.join(vendorCacheDir, platformPair);
    await fs.emptyDir(vendorActiveDir);
    await Promise.all(files.map(async f => {
        const dlPath = path.join(root, f.target);
        const outPath = path.join(vendorActiveDir, f.target);
        await getFile(f.url, dlPath, f.sha256);
        await fs.ensureDir(path.dirname(outPath));
        await fs.link(dlPath, outPath);
    }));

    await fs.copy(vendorActiveDir, outDir);
}

async function checkSha256(fp: string, hash: string): Promise<boolean> {
    if (!hash) return true;

    const h = crypto.createHash("sha256");
    const rs = fs.createReadStream(fp);
    rs.on("data", (chunk) => h.update(chunk));

    await pEvent(rs, "end");
    const eh = h.digest("hex").toLowerCase();
    return eh === hash;
}

export const vendor = { prepareAssets };
