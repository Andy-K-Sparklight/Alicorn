import { parentPort, workerData } from "node:worker_threads";
import { createHash } from "node:crypto";
import fs from "node:fs";

export interface HashWorkerData {
    path: string;
    algorithm: string;
}

function main() {
    const { path, algorithm } = workerData as HashWorkerData;

    const hash = createHash(algorithm);
    const rs = fs.createReadStream(path);

    rs.on("data", (chunk) => hash.update(chunk));
    rs.on("end", () => parentPort?.postMessage(hash.digest("hex")));
    rs.on("error", () => parentPort?.postMessage(""));
}

void main();