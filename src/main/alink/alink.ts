/**
 * Alicorn ALink is a method to improve game installation performance and reduce space consumption.
 * It works by hard-linking files with the same content. As these objects are stored (usually) on the same partition
 * with the game files, this can always be done.
 */
import { paths } from "@/main/fs/paths";
import fs from "fs-extra";
import path from "path";

function getFilePath(sha1: string) {
    return paths.alink.to("contents", sha1.slice(0, 2), sha1);
}

/**
 * Request a file from the ALink library to be linked to the given target.
 */
async function requestFile(sha1: string, target: string): Promise<boolean> {
    const src = getFilePath(sha1);

    try {
        await fs.access(src);
        await fs.ensureDir(path.dirname(target));
        await fs.link(src, target);
        return true;
    } catch {
        return false;
    }
}

export const alink = {
    requestFile
};