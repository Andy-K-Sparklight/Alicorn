import { createHash } from "node:crypto";
import fs from "node:fs";
import { pEvent } from "p-event";
import workerPool from "workerpool";

async function hash(path: string, algorithm: string): Promise<string> {
    const hash = createHash(algorithm);
    const rs = fs.createReadStream(path);
    rs.on("data", (chunk) => hash.update(chunk));

    await pEvent(rs, "end");
    return hash.digest("hex").toLowerCase();
}

workerPool.worker({ hash });
