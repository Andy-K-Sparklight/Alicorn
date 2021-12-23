import fs from "fs-extra";
import os from "os";
import path from "path";
import { copyFileStream, isFileExist } from "../commons/FileUtil";
import { getBasePath } from "./PathSolve";

const DATA_ROOT = path.resolve(os.homedir(), "alicorn");
export const DEFAULTS_ROOT = path.resolve(getBasePath(), "defaults");

export async function loadData(dataPath: string): Promise<string> {
  try {
    return (await fs.readFile(getActualDataPath(dataPath))).toString();
  } catch {
    return "";
  }
}

export function getPathInDefaults(pt: string): string {
  return path.resolve(DEFAULTS_ROOT, pt);
}

export function getActualDataPath(pt: string): string {
  return path.resolve(DATA_ROOT, pt);
}

export async function saveData(
  relativePath: string,
  data: string
): Promise<void> {
  try {
    const dest = getActualDataPath(relativePath);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, data, { mode: 0o777 });
  } catch {}
}

export function saveDataSync(relativePath: string, data: string): void {
  const dest = getActualDataPath(relativePath);
  fs.ensureDirSync(path.dirname(dest));
  fs.writeFileSync(dest, data, { mode: 0o777 });
}

// Hint: DO NOT use 'fs.copyFile' here!
// 'No permission', I don't know why, but we have to do this manually

export async function saveDefaultData(dfPath: string): Promise<void> {
  try {
    const dest = getActualDataPath(dfPath);
    if (await isFileExist(dest)) {
      return;
    }
    await copyFileStream(path.join(DEFAULTS_ROOT, dfPath), dest);
  } catch {}
}

export async function saveDefaultDataAs(
  dfPath: string,
  filename: string
): Promise<void> {
  try {
    const dest = getActualDataPath(filename);
    if (await isFileExist(dest)) {
      return;
    }
    await copyFileStream(path.join(DEFAULTS_ROOT, dfPath), dest);
  } catch (e) {
    console.log(e);
  }
}
