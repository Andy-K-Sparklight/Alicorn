import { reg } from "@/main/registry/registry";
import { app } from "electron";
import fs from "fs-extra";
import path from "node:path";

async function removeUnusedOAuthPartitions() {
    try {
        const root = path.join(app.getPath("userData"), "Partitions");
        const files = await fs.readdir(root);
        const existingParts = new Set(reg.accounts.getAll().filter(a => a.type === "vanilla").map(a => a.partitionId));
        for (const f of files) {
            if (f.startsWith("ms-auth-") && !existingParts.has(f)) {
                console.debug(`Removing unused OAuth partition: ${f}`);
                await fs.remove(path.join(root, f));
            }
        }
    } catch {}
}

export const cleaner = { removeUnusedOAuthPartitions };
