import fs from "fs-extra";
import path from "path";
import type lzmaJS from "lzma";
import { pipeline } from "stream/promises";
import { paths } from "@/main/fs/paths";
import { unwrapESM } from "@/main/util/module";

/**
 * Inflate a file known to be of LZMA format.
 */
async function inflate(src: string, dst: string) {
    await fs.ensureDir(path.dirname(dst));

    if (import.meta.env.AL_ENABLE_NATIVE_LZMA) {
        // Native impl

        // lzma-native uses node-gyp to resolve the prebuilt native modules
        // The path is not recognized nor bundled by ESBuild
        // By assigning to the magic variable we can override the resolution base directory
        const ap = process.env.ALICORN_PREBUILD;
        process.env.ALICORN_PREBUILD = paths.app.get("natives/lzma-native");
        const lz = await unwrapESM(import("lzma-native"));
        process.env.ALICORN_PREBUILD = ap;

        const rs = fs.createReadStream(src);
        const ts = lz.createDecompressor();
        const ws = fs.createWriteStream(dst);

        await pipeline(rs, ts, ws);
    } else {
        // JS impl

        // @ts-expect-error A workaround for using modules not exported
        const lz = (await unwrapESM(import("lzma/src/lzma_worker-min.js"))).LZMA_WORKER as typeof lzmaJS;
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