import type { HashWorkerData } from "@/main/security/hash-worker";
import { Worker } from "node:worker_threads";
import { paths } from "@/main/fs/paths";

async function checkFile(pt: string, algorithm: string, expectHash: string): Promise<boolean> {
    return await check(pt, algorithm, expectHash) as boolean;
}

async function forFile(pt: string, algorithm: string): Promise<string> {
    return await check(pt, algorithm) as string;
}

async function check(pt: string, algorithm: string, expectHash?: string): Promise<string | boolean> {
    const dat: HashWorkerData = { path: pt, algorithm, expect: expectHash };

    const w = new Worker(paths.app.to("hash-worker.js"), { workerData: dat });
    return new Promise<string | boolean>((res, rej) => {
        function err() {
            rej(`Failed to hash file: ${pt}`);
        }

        w.once("exit", err);
        w.once("message", (m) => {
            if (m === "") err();
            else res(m);
        });
    });
}

export const hash = {
    forFile, checkFile
};