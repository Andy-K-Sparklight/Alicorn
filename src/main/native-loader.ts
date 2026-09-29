import crypto from "node:crypto";
import { app } from "electron";
import fs from "fs-extra";
import { paths } from "@/main/fs/paths";
import type * as NativeMod from "~/build/types/alicorn-r";

type AlicornNative = typeof NativeMod;

let native: AlicornNative | null = null;

export async function loadNativeModule() {
    const lib = paths.app.to("r", process.env.ALICORN_NATIVE_NAME);

    console.log("Loading library: " + lib);

    // Don't use security/hash, which itself requires native!
    await verifyHash(lib, "sha256", process.env.ALICORN_NATIVE_SHA256);

    // @ts-expect-error Using globally defined polyfill
    native = createRequire(import.meta.url)(lib) as AlicornNative;
}

async function verifyHash(fp: string, alg: string, h: string) {
    const { promise, resolve, reject } = Promise.withResolvers<string>();
    const hash = crypto.createHash(alg);
    const stream = fs.createReadStream(fp);

    stream.on("data", data => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex").toLowerCase()));
    stream.on("error", err => reject(err));

    const data = await promise;

    if (data !== h) {
        console.error(`Native library hash mismatch (expected ${h} but found ${data})`);
        console.error("Is the file being tampered with, or did you packed the wrong library?");
        app.exit(1);
    }
}

/**
 * Gets the native bindings once loaded.
 */
export function getNative(): AlicornNative {
    if (!native) {
        throw "Native module is not initialized.";
    }
    return native;
}
