import fs from "fs-extra";
import path from "path";
import os from "os";
import { copyFileStream, isFileExist } from "./FileUtil";

const DATA_ROOT = path.resolve(os.homedir(), "alicorn");
const DEFAULTS_ROOT = path.resolve("defaults");

export function resolveDataFilePath(dataPath: string): string {
  return path.join(DATA_ROOT, dataPath);
}

export async function loadData(dataPath: string): Promise<string> {
  try {
    return (await fs.readFile(resolveDataFilePath(dataPath))).toString();
  } catch {
    return "";
  }
}

export function getPathInDefaults(pt: string): string {
  return path.resolve(path.join(DEFAULTS_ROOT, pt));
}

export function getActualDataPath(pt: string): string {
  return path.resolve(path.join(DATA_ROOT, pt));
}

export async function saveData(
  relativePath: string,
  data: string
): Promise<void> {
  const dest = resolveDataFilePath(relativePath);
  await fs.ensureDir(path.dirname(dest));
  await fs.writeFile(dest, data);
}

// Hint: NEVER use 'fs.copyFile'!
// 'No permission', I don't know why, but we have to do this manually

export async function saveDefaultData(dfPath: string): Promise<void> {
  const dest = resolveDataFilePath(dfPath);
  if (await isFileExist(dest)) {
    return;
  }
  await copyFileStream(path.join(DEFAULTS_ROOT, dfPath), dest);
}
