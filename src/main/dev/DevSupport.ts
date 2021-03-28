import { resolveDataFilePath, saveDefaultData } from "../config/DataSupport";
import fs from "fs-extra";
import { isFileExist } from "../config/ConfigSupport";

export const DEV_NAME = "dev.lock.ald";

export async function saveDevLockFile(): Promise<void> {
  await saveDefaultData(DEV_NAME);
}

export async function removeDevLockFile(): Promise<void> {
  try {
    await fs.remove(resolveDataFilePath(DEV_NAME));
  } catch {
    return;
  }
}

export async function isDev(): Promise<boolean> {
  return await isFileExist(resolveDataFilePath(DEV_NAME));
}
