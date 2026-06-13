import path from "node:path";
import { pipeline } from "node:stream/promises";
import fs from "fs-extra";
import type lzmaNative from "lzma-native";
import workerPool from "workerpool";
import { paths } from "@/main/fs/paths";
import { unwrapESM } from "@/main/util/module";
import pkg from "~/package.json";

let lzmaNativeMod: typeof lzmaNative;
let lzmaWasmMod: workerPool.Pool;

async function init() {
    if (lzmaNativeMod || lzmaWasmMod) return; // Already loaded

    if (import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        try {
            // lzma-native uses node-gyp to resolve the prebuilt native modules
            // The path is not recognized nor bundled by ESBuild
            // By assigning to the magic variable we can override the resolution base directory
            const canonicalName = `${pkg.name.toUpperCase().replaceAll("-", "_")}_PREBUILD`;
            const ap = process.env[canonicalName];
            process.env[canonicalName] = paths.app.to("natives/lzma-native");
            lzmaNativeMod = (await unwrapESM(import("lzma-native"))).default;
            process.env[canonicalName] = ap;
            return;
        } catch (ex) {
            console.log("Failed to load native LZMA module: " + ex);
            console.log("Falling back to the WASM version.");
        }
    }

    console.log("Loading LZMA WASM module.");
    lzmaWasmMod = workerPool.pool(paths.app.to("lzma.js"));
}

/**
 * Inflate a file known to be of LZMA format.
 */
async function inflate(src: string, dst: string) {
    await fs.ensureDir(path.dirname(dst));

    if (import.meta.env.AL_ENABLE_NATIVE_LZMA && lzmaNativeMod) {
        // Native impl
        const rs = fs.createReadStream(src);
        const ts = lzmaNativeMod.createDecompressor();
        const ws = fs.createWriteStream(dst);

        await pipeline(rs, ts, ws);
    } else {
        // WASM impl
        const dat = await fs.readFile(src);
        const out = await lzmaWasmMod.exec("decompress", [dat]);
        await fs.writeFile(dst, out);
    }
}

export const lzma = { inflate, init };
