import { AddonInfo, File } from "./Get";
import path from "path";
import { GLOBAL_CACHE_NAME, GLOBAL_FILE_NAME } from "./Values";
import objectHash from "object-hash";
import fs from "fs-extra";

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
      objectHash(file.fileDate)
    );
    await fs.access(TARGET_FILE);
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
      objectHash(file.fileDate)
    );
    await fs.copyFile(origin, TARGET_FILE);
  } catch {}
}
