import { paths } from "@/main/fs/paths";
import type { HashWorkerData } from "@/main/security/hash-worker";
import { Worker } from "node:worker_threads";
import { pEvent } from "p-event";

async function checkFile(pt: string, algorithm: string, expectHash: string): Promise<boolean> {
    return await check(pt, algorithm, expectHash) as boolean;
}

async function forFile(pt: string, algorithm: string): Promise<string> {
    return await check(pt, algorithm) as string;
}

async function check(pt: string, algorithm: string, expectHash?: string): Promise<string | boolean> {
    const dat: HashWorkerData = { path: pt, algorithm, expect: expectHash };

    const w = new Worker(paths.app.to("hash-worker.js"), { workerData: dat });

    const hs = await pEvent(w, ["exit", "message"]);

    if (!hs) throw `Failed to hash file: ${pt}`;

    return hs;
}

export const hash = {
    forFile, checkFile
};
