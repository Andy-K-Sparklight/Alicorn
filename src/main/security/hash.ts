import type { HashWorkerData } from "@/main/security/hash-worker";
import { Worker } from "node:worker_threads";
import { paths } from "@/main/fs/paths";

async function forFile(pt: string, algorithm: string): Promise<string> {
    const dat: HashWorkerData = { path: pt, algorithm };

    const w = new Worker(paths.app.to("hash-worker.js"), { workerData: dat });
    return new Promise<string>((res, rej) => {
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
    forFile
};