import { ensureDir, outputFile, symlink, unlink } from "fs-extra";
import path from "path";
import { tr } from "../../renderer/Translator";
import { basicHash } from "../commons/BasicHash";
import { PLACE_HOLDER } from "../commons/Constants";
import { isFileExist } from "../commons/FileUtil";
import { getString } from "../config/ConfigSupport";
import { getActualDataPath } from "../config/DataSupport";
import { DownloadMeta } from "../download/AbstractDownloader";
import { addDoing, wrappedDownloadFile } from "../download/DownloadWrapper";
import { MinecraftContainer } from "./MinecraftContainer";

const ASC_NAME = "asc.lock";

// Use symlink
export async function isSharedContainer(
    container: MinecraftContainer
): Promise<boolean> {
    return await isFileExist(container.resolvePath(ASC_NAME));
}

export async function markASC(dir: string): Promise<void> {
    await outputFile(path.join(dir, ASC_NAME), PLACE_HOLDER, {mode: 0o777});
}

const STANDALONE_FILE = /forge|client|fabric/i;
const STANDALONE_PATH = /net[/\\](minecraft(forge)?|fabricmc)/i;

export function needsStandalone(pt: string): boolean {
    return STANDALONE_FILE.test(path.basename(pt)) || STANDALONE_PATH.test(pt);
}

export async function fetchSharedFile(meta: DownloadMeta): Promise<boolean> {
    if (meta.url.trim() === "") {
        return true; // NULL safe
    }
    if (await isFileExist(meta.savePath)) {
        return true; // Skip if exists
    }
    const u = new URL(meta.url);
    const urlSHA = basicHash(meta.url) + "-" + basicHash(u.host);
    const root = getString("cx.shared-root");
    let targetFile: string;
    if (root.trim().length > 0) {
        targetFile = path.join(root, urlSHA);
    } else {
        targetFile = getActualDataPath(path.join("cx-shared", urlSHA));
    }
    let t = 1;
    if (!(await isFileExist(targetFile))) {
        const metaX = new DownloadMeta(meta.url, targetFile, meta.sha1, meta.size);
        t = await wrappedDownloadFile(metaX, true);
    }

    if (t === 1) {
        await ensureDir(path.dirname(meta.savePath));
        try {
            await symlink(targetFile, meta.savePath, "file");
        } catch {
            try {
                await unlink(meta.savePath);
                await symlink(targetFile, meta.savePath, "file");
                addDoing(tr("ReadyToLaunch.Linked", `Url=${meta.url}`));
                return true;
            } catch {
                return false;
            }
        }
        return true;
    }
    return false;
}
