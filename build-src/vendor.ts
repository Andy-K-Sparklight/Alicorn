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

const contents = {
    aria2c: {
        "win32-x64": {
            url: "https://files.catbox.moe/61p0gr.zip",
            target: "aria2c.exe",
            sha256: "be2099c214f63a3cb4954b09a0becd6e2e34660b886d4c898d260febfe9d70c2"
        },

        "win32-arm64": {
            url: "https://files.catbox.moe/zx4nbv.dat",
            target: "aria2c.exe",
            sha256: "33c775256f64123515f32a8252200ef2ab5ad72963981c694dff5e61d650f6be"
        },

        "linux-x64": {
            url: "https://files.catbox.moe/6wd7vt",
            target: "aria2c",
            sha256: "9eb136e28c02e352175d68c2a9db419d584b4a8acc780f77bbe6c40978f387d0"
        }
    },

    certificate: {
        "*": {
            url: "https://curl.se/ca/cacert-2025-05-20.pem",
            target: "ca-cert.pem",
            sha256: "ab3ee3651977a4178a702b0b828a4ee7b2bbb9127235b0ab740e2e15974bf5db"
        }
    },

    ffind: {
        "*": {
            url: "https://github.com/skjsjhb/ffind/releases/download/1.2/ffind-1.2.jar",
            target: "ffind-1.2.jar",
            sha256: "74e47751ce9ae0fde412af400b1a45058a543c1e77a8c137deb24d209aa53d78"
        }
    },

    unfine: {
        "*": {
            url: "https://github.com/skjsjhb/unfine/releases/download/1.0/unfine-1.0.jar",
            target: "unfine-1.0.jar",
            sha256: "6dc5297f1b83e7daeb29b7f153d54f797fd5c715cfe736d55ad0d98846c9352d"
        }
    },

    "authlib-injector": {
        "*": {
            url: "https://github.com/yushijinhun/authlib-injector/releases/download/v1.2.5/authlib-injector-1.2.5.jar",
            target: "authlib-injector-1.2.5.jar",
            sha256: "3bc9ebdc583b36abd2a65b626c4b9f35f21177fbf42a851606eaaea3fd42ee0f"
        }
    }
} as Record<string, Record<string, VendorFile>>;

const vendorCacheDir = path.join(import.meta.dirname, "..", "vendor", "cache");
const vendorActiveDir = path.join(import.meta.dirname, "..", "vendor", "active");

function createFileList(cfg: BuildConfig): VendorFile[] {
    const { variant: { platform, arch } } = cfg;

    const platformPair = platform + "-" + arch;

    function getComponent(name: string) {
        return contents[name][platformPair] ?? contents[name]["*"];
    }

    return [
        getComponent("aria2c"),
        getComponent("certificate"),
        getComponent("ffind"),
        getComponent("unfine"),
        getComponent("authlib-injector")
    ].filter(isTruthy);
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
