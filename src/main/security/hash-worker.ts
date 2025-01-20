import { createHash } from "node:crypto";
import fs from "node:fs";
import { parentPort, workerData } from "node:worker_threads";
import { pEvent } from "p-event";

export interface HashWorkerData {
    path: string;
    algorithm: string;
    expect?: string;
}

async function main() {
    const { path, algorithm, expect } = workerData as HashWorkerData;

    const hash = createHash(algorithm);
    const rs = fs.createReadStream(path);

    rs.on("data", (chunk) => hash.update(chunk));

    let result: unknown;

    try {
        await pEvent(rs, "end");

        const h = hash.digest("hex").toLowerCase().trim();
        result = expect ? h === expect.toLowerCase().trim() : h;
    } catch {
        result = expect ? false : "";
    }

    parentPort!.postMessage(result);
}

void main();
