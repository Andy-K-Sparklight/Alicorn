/**
 * Module to handle containers capable for linking files.
 */
import { paths } from "@/main/fs/paths";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import path from "path";

function getCachePath(sha1: string) {
    return paths.game.to(".store", sha1.slice(0, 2), sha1);
}

/**
 * Validates the cache object. Re-sign changed files and remove corrupted ones.
 */
async function checkFile(sha1: string): Promise<boolean> {
    const fp = getCachePath(sha1);
    const sp = fp + ".sig";

    try {
        const st = await fs.stat(fp);

        let shouldVerify = false;
        let shouldUpdateSig = false;

        try {
            const d = parseInt((await fs.readFile(sp)).toString(), 10);
            if (st.mtimeMs <= d) {
                // File still valid
                return true;
            }

            shouldVerify = true;
            shouldUpdateSig = true;
        } catch {
            shouldUpdateSig = true;
            // No valid signature
            if (st.ctimeMs !== st.mtimeMs) {
                shouldVerify = true;
            }
        }

        if (shouldVerify) {
            if (!await hash.checkFile(fp, "sha1", sha1)) {
                // File invalid, remove it
                console.warn(`Possibly corrupted store file: ${fp}`);
                await fs.remove(fp);
                await fs.remove(sp);
                return false;
            }

            console.debug(`File revalidated: ${fp}`);
        }

        if (shouldUpdateSig) {
            await signFile(sha1);
        }

        return true;
    } catch {
        return false; // File not exist or not readable
    }
}

async function signFile(sha1: string) {
    try {
        const fp = getCachePath(sha1);
        const sp = fp + ".sig";
        const stat = await fs.stat(fp);
        await fs.writeFile(sp, stat.mtimeMs.toString());
        console.debug(`File mtime signature updated: ${sha1}`);
    } catch (e) {
        console.warn(`Unable to add file mtime signature for ${sha1}: ${e}`);
    }
}

/**
 * Adds a file to the cache.
 */
async function enroll(fp: string, sha1?: string) {
    try {
        if (!sha1) {
            sha1 = await hash.forFile(fp, "sha1");
        }
    } catch (e) {
        console.warn(`Unable to enroll ${fp}: ${e}`);
        return; // Unable to get cache for the existing file
    }

    if (await checkFile(sha1)) return;

    try {
        const ep = getCachePath(sha1);
        await fs.remove(ep); // Delete existing object
        await fs.ensureDir(path.dirname(ep));
        await fs.copy(fp, ep); // Add file to cache
        console.log("Signing file");
        await signFile(sha1);
    } catch (e) {
        console.warn(`Unable to enroll ${fp}: ${e}`);
    }
}

/**
 * Tries to find existing object and copy it to the target.
 */
async function deploy(target: string, sha1: string): Promise<boolean> {
    if (!await checkFile(sha1)) return false; // Object corrupted

    try {
        await fs.ensureDir(path.dirname(target));
        await fs.remove(target);
        await fs.copy(getCachePath(sha1), target);
        console.debug(`Cache used: ${sha1} -> ${target}`);
        return true;
    } catch (e) {
        console.warn(`Unable to deploy cache to ${target}: ${e}`);
        return false;
    }
}

/**
 * Links the file to existing cache.
 */
async function link(fp: string, sha1?: string) {
    try {
        if (!sha1) {
            sha1 = await hash.forFile(fp, "sha1");
        }

        const ep = getCachePath(sha1);

        try {
            if (await checkFile(sha1)) {
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
        await signFile(sha1);
    } catch (e) {
        console.warn(`Unable to link file ${fp}: ${e}`);
    }
}

export const cache = { link, enroll, deploy };
