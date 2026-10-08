import crypto from "node:crypto";
import path from "node:path";
import consola from "consola";
import fs from "fs-extra";

export async function linkAll(src: string, dst: string): Promise<void> {
    const st = await fs.stat(src);
    if (st.isFile()) {
        await fs.link(src, dst);
        return;
    }

    if (st.isDirectory()) {
        const files = await fs.readdir(src);
        await fs.ensureDir(dst);

        for (const f of files) {
            await linkAll(path.join(src, f), path.join(dst, f));
        }
    }
}

/**
 * Calculates the checksum of `fp`.
 */
export function checksumOf(fp: string, alg: string): Promise<string> {
    const { promise, resolve, reject } = Promise.withResolvers<string>();
    const hash = crypto.createHash(alg);
    const stream = fs.createReadStream(fp);

    stream.on("data", data => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);

    return promise;
}

/**
 * Returns the function's result, or logs an error and returns `null` if it fails.
 */
export async function logOnFail<T>(run: () => Promise<T>): Promise<T | null> {
    try {
        return await run();
    } catch (e) {
        consola.error("Error: " + e);
        return null;
    }
}
