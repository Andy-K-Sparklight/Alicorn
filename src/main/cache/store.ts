/**
 * The cache store module maintains a directory containing multiple objects.
 * Objects are downloaded files named by their hash.
 *
 * Cached files have to main usages:
 *
 * - Provide source for hard-linking reusable files.
 * - Speed up the download.
 *
 * Cached files are stored under the temp directory.
 */
import { paths } from "@/main/fs/paths";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import path from "path";


function getObject(sha1: string) {
    return paths.temp.to("cache.v2", sha1.slice(0, 2), sha1);
}

/**
 * Finds and deploys an object with the given hash to the specified target path.
 * Returns whether the operation is successful.
 */
async function deploy(sha1: string, target: string, method: "copy" | "link"): Promise<boolean> {
    try {
        const fp = getObject(sha1);

        await fs.access(fp);

        if (!await hash.checkFile(fp, "sha1", sha1)) {
            console.warn(`Removing corrupted cache: ${fp}`);
            await fs.remove(fp);
            return false;
        }

        await fs.ensureDir(path.dirname(target));

        switch (method) {
            case "copy":
                await fs.copy(fp, target);
                break;
            case "link":
                await fs.link(fp, target);
                break;
        }

        console.debug(`Reused cached file ${fp} -> ${target}`);
    } catch {}

    return false;
}

/**
 * Adds a file into cache.
 */
async function enroll(source: string, sha1?: string): Promise<void> {
    try {
        let h = sha1;
        if (!h) {
            h = await hash.forFile(source, "sha1");
        }

        const fp = getObject(h);
        await fs.ensureDir(path.dirname(fp));
        await fs.copy(source, fp);
    } catch {}
}

export const cacheStore = { deploy, enroll };
