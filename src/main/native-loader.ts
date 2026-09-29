import { app } from "electron";
import { paths } from "@/main/fs/paths";
import { hash } from "@/main/security/hash";
import type * as NativeMod from "~/build/types/alicorn-r";

type AlicornNative = typeof NativeMod;

let native: AlicornNative | null = null;

export async function loadNativeModule() {
    const lib = paths.app.to("r", process.env.ALICORN_NATIVE_NAME);

    console.log("Loading library: " + lib);

    await verifyHash(lib, "sha256", process.env.ALICORN_NATIVE_SHA256);

    // @ts-expect-error Using globally defined polyfill
    native = createRequire(import.meta.url)(lib) as AlicornNative;
}

async function verifyHash(fp: string, alg: string, h: string) {
    const data = await hash.forFile(fp, alg);

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
