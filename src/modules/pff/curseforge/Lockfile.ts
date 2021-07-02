import { MinecraftContainer } from "../../container/MinecraftContainer";
import { isFileExist } from "../../commons/FileUtil";
import { readJSON, writeJSON } from "fs-extra";
import { AddonInfo, File } from "./Get";

export interface Lockfile {
  files: Record<string, FileMeta>;
}

export interface FileMeta {
  fileName: string;
  addonId: number;
  fileId: number;
  fileDate: string;
  gameVersion: string;
}

// This operation modify the lockfile
export async function fixLockFile(
  lockfile: Lockfile,
  container: MinecraftContainer
): Promise<void> {
  await Promise.allSettled(
    Object.keys(lockfile.files).map((name) => {
      if (!isFileExist(container.getModJar(lockfile.files[name].fileName))) {
        delete lockfile.files[name];
      }
    })
  );
}

export function writeToLockFile(
  addon: AddonInfo,
  file: File,
  lockfile: Lockfile,
  gameVersion: string
): void {
  lockfile.files[`${addon.id.toString(16)}/${file.id.toString(16)}`] = {
    addonId: addon.id,
    fileId: file.id,
    fileName: file.fileName,
    fileDate: file.fileDate,
    gameVersion: gameVersion,
  };
}

export async function saveLockFile(
  lockfile: Lockfile,
  container: MinecraftContainer
): Promise<void> {
  try {
    await writeJSON(container.getPffLockFile(), lockfile);
  } catch {}
}

export async function loadLockFile(
  container: MinecraftContainer
): Promise<Lockfile> {
  try {
    return (await readJSON(container.getPffLockFile())) as Lockfile;
  } catch {
    return { files: {} };
  }
}
