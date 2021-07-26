import { ensureDir, symlink, writeFile } from "fs-extra";
import objectHash from "object-hash";
import os from "os";
import path from "path";
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
  const u = new URL(meta.url);
  const urlSHA = objectHash(meta.url) + "-" + objectHash(u.host);
  const root = getString("cx.shared-root", os.homedir(), true);
  let targetFile: string;
  if (root.trim().length > 0) {
    targetFile = path.join(root, urlSHA);
  } else {
    targetFile = getActualDataPath(path.join("cx-shared", urlSHA));
  }
  const metaX = new DownloadMeta(meta.url, targetFile, meta.sha1);
  const t = await wrappedDownloadFile(metaX, true);
  if (t === 1) {
    await ensureDir(path.dirname(meta.savePath));
    try {
      await symlink(targetFile, meta.savePath, "file");
    } catch {}
    return true;
  }
  return false;
}
