import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import os from "node:os";
import path from "node:path";
import pLimit from "p-limit";


async function applyOverrides(zip: StreamZip.StreamZipAsync, prefix: string, root: string, control?: ProgressController) {
    const { onProgress } = control ?? {};
    const entries = await zip.entries();
    const limit = pLimit(os.availableParallelism());
    const ps = Object.values(entries)
        .filter(ent => ent.name.startsWith(prefix) && ent.isFile)
        .map(ent => limit(async () => {
            const fp = path.join(root, ent.name.slice(prefix.length));

            console.debug(`Extracting override file: ${ent.name} -> ${fp}`);

            await fs.ensureDir(path.dirname(fp));
            await fs.remove(fp);
            await zip!.extract(ent, fp);
        }));

    await Promise.all(progress.countPromises(ps, progress.makeNamed(onProgress, "modpack.unpack-files")));
}


export const modpackTools = { applyOverrides };
