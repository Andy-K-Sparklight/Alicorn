import fs from "fs-extra";
import path from "path";
import { uniqueHash } from "../../commons/BasicHash";
import { AddonInfo, File } from "./Get";
import { GLOBAL_CACHE_NAME, GLOBAL_FILE_NAME } from "./Values";

export async function findCachedFile(
  file: File,
  addon: AddonInfo,
  cacheRoot: string
): Promise<string | undefined> {
  try {
    const TARGET_FILE = path.join(
      cacheRoot,
      GLOBAL_CACHE_NAME,
      GLOBAL_FILE_NAME,
      addon.id.toString(16),
      file.id.toString(16),
      uniqueHash(file.fileDate)
    );
    await fs.access(TARGET_FILE);
    return TARGET_FILE;
  } catch {
    return undefined;
  }
}

export async function writeCachedFile(
  file: File,
  addon: AddonInfo,
  cacheRoot: string,
  origin: string
): Promise<void> {
  try {
    const TARGET_FILE = path.join(
      cacheRoot,
      GLOBAL_CACHE_NAME,
      GLOBAL_FILE_NAME,
      addon.id.toString(16),
      file.id.toString(16),
      uniqueHash(file.fileDate)
    );
    await fs.ensureDir(path.dirname(TARGET_FILE));
    await fs.copyFile(origin, TARGET_FILE);
  } catch {}
}
