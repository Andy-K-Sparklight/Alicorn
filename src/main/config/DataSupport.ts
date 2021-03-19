import fs from "fs-extra";
import path from "path";
import os from "os";
import { isFileExist } from "./ConfigSupport";

const DATA_ROOT = path.resolve(os.homedir(), "alicorn");
const DEFAULTS_ROOT = path.resolve("defaults");

export async function loadData(dataPath: string): Promise<string> {
  try {
    const dest = path.join(DATA_ROOT, dataPath);
    return (await fs.readFile(dest)).toString();
  } catch {
    return "";
  }
}

export async function saveData(
  relativePath: string,
  data: string
): Promise<void> {
  const dest = path.join(DATA_ROOT, relativePath);
  await fs.ensureDir(path.dirname(dest));
  await fs.writeFile(dest, data);
}

// Hint: NEVER use 'fs.copyFile'!
// 'No permission', I don't know why, but we have to do this manually

export async function saveDefaultData(dfPath: string): Promise<void> {
  const dest = path.join(DATA_ROOT, dfPath);
  if (await isFileExist(dest)) {
    return;
  }
  await fs.ensureDir(path.dirname(dest));
  const stream = fs
    .createReadStream(path.join(DEFAULTS_ROOT, dfPath))
    .pipe(fs.createWriteStream(dest));
  return new Promise<void>((resolve, reject) => {
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (e) => {
      reject(e);
    });
  });
}
