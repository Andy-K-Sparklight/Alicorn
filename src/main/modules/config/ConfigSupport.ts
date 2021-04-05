import path from "path";
import os from "os";
import fs from "fs-extra";
import { isFileExist } from "./FileUtil";

const CONFIG_FILE = path.resolve(
  os.homedir(),
  "alicorn",
  "alicorn.config.json"
);

const DEFAULT_CONFIG_FILE = path.resolve("defaults", "alicorn.config.json");

let cachedConfig = {};

export function get(key: string, def: unknown): unknown {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return cachedConfig[key] || def;
}

export function getString(key: string, def: string): string {
  const val = get(key, def);
  if (typeof val === "string") {
    return val;
  }
  if (typeof val === "object" && val !== undefined && val !== null) {
    return val.toString();
  }
  return String(val) || def;
}

export function getNumber(key: string, def: number): number {
  const val = get(key, def);
  if (typeof val === "number") {
    return val;
  }
  if (typeof val === "string") {
    const pInt = parseInt(val);
    if (!isNaN(pInt)) {
      return pInt;
    }
    const pFloat = parseFloat(val);
    if (!isNaN(pFloat)) {
      return pFloat;
    }
  }
  return def;
}

export async function loadConfig(): Promise<void> {
  try {
    if (!(await isFileExist(CONFIG_FILE))) {
      await saveDefaultConfig();
    }
    cachedConfig = JSON.parse((await fs.readFile(CONFIG_FILE)).toString());
  } catch {
    await saveDefaultConfig();
  }
}

export function saveConfigSync(): void {
  fs.ensureDirSync(path.dirname(CONFIG_FILE));
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cachedConfig));
}

async function saveDefaultConfig() {
  await fs.ensureDir(path.dirname(CONFIG_FILE));
  const stream = fs
    .createReadStream(DEFAULT_CONFIG_FILE)
    .pipe(fs.createWriteStream(CONFIG_FILE));
  return new Promise<void>((resolve, reject) => {
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (e) => {
      reject(e);
    });
  });
}
