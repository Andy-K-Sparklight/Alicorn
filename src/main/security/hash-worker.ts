import { parentPort, workerData } from "node:worker_threads";
import { createHash } from "node:crypto";
import fs from "node:fs";

export interface HashWorkerData {
    path: string;
    algorithm: string;
    expect?: string;
}

function main() {
    const { path, algorithm, expect } = workerData as HashWorkerData;

    const hash = createHash(algorithm);
    const rs = fs.createReadStream(path);

    rs.on("data", (chunk) => hash.update(chunk));
    rs.once("end", () => {
        const h = hash.digest("hex").toLowerCase().trim();
        if (expect) {
            parentPort?.postMessage(h === expect.toLowerCase().trim());
        } else {
            parentPort?.postMessage(h);
        }
    });
    rs.once("error", () => {
        if (expect) {
            parentPort?.postMessage(false);
        } else {
            parentPort?.postMessage("");
        }
    });
}

void main();