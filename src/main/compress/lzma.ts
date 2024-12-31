import fs from "fs-extra";
import path from "path";
import type lzmaNative from "lzma-native";
import type lzmaJS from "lzma";
import { pipeline } from "stream/promises";
import { paths } from "@/main/fs/paths";
import { unwrapESM } from "@/main/util/module";
import pkg from "~/package.json";

let lzmaNativeMod: typeof lzmaNative;
let lzmaJSMod: typeof lzmaJS;


async function init() {
    if (lzmaNativeMod || lzmaJSMod) return; // Already loaded

    if (import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        // lzma-native uses node-gyp to resolve the prebuilt native modules
        // The path is not recognized nor bundled by ESBuild
        // By assigning to the magic variable we can override the resolution base directory
        const canonicalName = pkg.name.toUpperCase().replaceAll("-", "_") + "_PREBUILD";
        const ap = process.env[canonicalName];
        process.env[canonicalName] = paths.app.to("natives/lzma-native");
        lzmaNativeMod = (await unwrapESM(import("lzma-native"))).default;
        process.env[canonicalName] = ap;
    } else {
        // @ts-expect-error A workaround for using modules not exported
        const m = await unwrapESM(import("lzma/src/lzma_worker-min.js"));
        lzmaJSMod = m.default.LZMA_WORKER as typeof lzmaJS;
    }
}


/**
 * Inflate a file known to be of LZMA format.
 */
async function inflate(src: string, dst: string) {
    await fs.ensureDir(path.dirname(dst));

    if (import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        // Native impl
        const rs = fs.createReadStream(src);
        const ts = lzmaNativeMod.createDecompressor();
        const ws = fs.createWriteStream(dst);

        await pipeline(rs, ts, ws);
    } else {
        // JS impl
        const dat = await fs.readFile(src);
        const inflated = await new Promise<Buffer>((res, rej) => {
            lzmaJSMod.decompress(dat, (r, e) => {
                if (e) rej(e);
                else res(Buffer.from(r));
            });
        });

        await fs.writeFile(dst, inflated);
    }
}

export const lzma = { inflate, init };