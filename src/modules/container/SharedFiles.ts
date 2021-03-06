import { ensureDir, symlink, unlink, writeFile } from "fs-extra";
import path from "path";
import { basicHash } from "../commons/BasicHash";
import { PLACE_HOLDER } from "../commons/Constants";
import { isFileExist } from "../commons/FileUtil";
import { getString } from "../config/ConfigSupport";
import { getActualDataPath } from "../config/DataSupport";
import { DownloadMeta } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import { MinecraftContainer } from "./MinecraftContainer";
const ASC_NAME = "asc.lock";
// Use symlink
export async function isSharedContainer(
  container: MinecraftContainer
): Promise<boolean> {
  return await isFileExist(container.resolvePath(ASC_NAME));
}

export async function markASC(dir: string): Promise<void> {
  await writeFile(path.join(dir, ASC_NAME), PLACE_HOLDER);
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
    const metaX = new DownloadMeta(meta.url, targetFile, meta.sha1);
    t = await wrappedDownloadFile(metaX, true);
  }

  if (t === 1) {
    console.log("Target file at " + targetFile);
    await ensureDir(path.dirname(meta.savePath));
    try {
      await symlink(targetFile, meta.savePath, "file");
    } catch {
      try {
        await unlink(meta.savePath);
        await symlink(targetFile, meta.savePath, "file");
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
  return false;
}
