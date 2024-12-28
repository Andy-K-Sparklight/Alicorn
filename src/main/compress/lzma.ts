import fs from "fs-extra";
import path from "path";
import type lzmaNative from "lzma-native";
import type lzmaJS from "lzma";
import { pipeline } from "stream/promises";
import { paths } from "@/main/fs/paths";

let nativeLZMA: typeof lzmaNative | null = null;
let jsLZMA: typeof lzmaJS | null = null;

async function loadNativeLzma(): Promise<typeof lzmaNative> {
    if (import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        if (!nativeLZMA) {
            // lzma-native uses node-gyp to resolve the prebuilt native modules
            // The path is not recognized nor bundled by ESBuild
            // By assigning to the magic variable we can override the resolution base directory
            const ap = process.env.ALICORN_PREBUILD;
            process.env.ALICORN_PREBUILD = paths.app.get("natives/lzma-native");
            nativeLZMA = (await import("lzma-native")).default;
            process.env.ALICORN_PREBUILD = ap;
        }
        return nativeLZMA;
    }
    throw "Native LZMA implementation is disabled";
}

async function loadJSLZMA(): Promise<typeof lzmaJS> {
    if (!import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        if (!jsLZMA) {
            // @ts-expect-error A workaround for using modules not exported
            jsLZMA = (await import("lzma/src/lzma_worker")).default.LZMA_WORKER as typeof lzmaJS;
        }
        return jsLZMA;
    }
    throw "JavaScript LZMA implementation is disabled";
}

/**
 * Inflate a file known to be of LZMA format.
 */
async function inflate(src: string, dst: string) {
    await fs.ensureDir(path.dirname(dst));

    if (import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        // Native impl
        const lz = await loadNativeLzma();
        const rs = fs.createReadStream(src);
        const ts = lz.createDecompressor();
        const ws = fs.createWriteStream(dst);

        await pipeline(rs, ts, ws);
    } else {
        // JS impl
        const lz = await loadJSLZMA();
        const dat = await fs.readFile(src);

        const inflated = await new Promise<Buffer>((res, rej) => {
            lz.decompress(dat, (r, e) => {
                if (e) rej(e);
                else res(Buffer.from(r));
            });
        });

        await fs.writeFile(dst, inflated);
    }
}

export const lzma = { inflate };