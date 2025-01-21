/**
 * Module to handle containers capable for linking files.
 */
import { paths } from "@/main/fs/paths";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import path from "path";

function getStorePath(sha1: string) {
    return paths.game.to(".store", sha1.slice(0, 2), sha1);
}

/**
 * Links the file to existing cache.
 */
async function link(fp: string, sha1?: string) {
    try {
        if (!sha1) {
            sha1 = await hash.forFile(fp, "sha1");
        }

        const ep = getStorePath(sha1);

        try {
            await fs.access(ep);
            if (await hash.checkFile(ep, "sha1", sha1)) {
                // Link the file
                await fs.remove(fp);
                await fs.ensureDir(path.dirname(fp));
                await fs.link(ep, fp);
                console.debug(`File compacted: ${ep} -> ${fp}`);
                return;
            }
        } catch {
        }

        await fs.remove(ep); // Delete corrupted cache, if any
        await fs.ensureDir(path.dirname(ep));
        await fs.link(fp, ep); // Link backward

    } catch (e) {
        console.warn(`Unable to link file ${fp}: ${e}`);
    }
}

export const clinker = { link };
