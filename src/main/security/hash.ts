import { paths } from "@/main/fs/paths";
import lazyValue from "lazy-value";
import workerPool from "workerpool";

let pool = lazyValue(() => workerPool.pool(paths.app.to("hash-worker.js")));

async function checkFile(pt: string, algorithm: string, expectHash: string): Promise<boolean> {
    return await forFile(pt, algorithm) === expectHash.trim().toLowerCase();
}

async function forFile(pt: string, algorithm: string): Promise<string> {
    const h = await pool().exec("hash", [pt, algorithm]);

    if (!h) throw `Failed to hash file: ${pt}`;
    return h;
}

export const hash = {
    forFile, checkFile
};
