import { ipcRenderer } from "electron";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { isFileExist } from "../commons/FileUtil";
import { DEFAULTS_ROOT } from "./DataSupport";
import { getBasePath } from "./PathSolve";

const CONFIG_FILE = path.resolve(
  os.homedir(),
  "alicorn",
  "alicorn.config.json"
);

const DEFAULT_CONFIG_FILE = path.resolve(
  getBasePath(),
  "defaults",
  "alicorn.config.json"
);

let cachedConfig = {};
let defaultConfig = {};
export function set(key: string, value: unknown): void {
  // @ts-ignore
  cachedConfig[key] = value;
}

export function get(key: string, def: unknown): unknown {
  // @ts-ignore
  let v = cachedConfig[key];
  if (v === undefined && !key.endsWith("?")) {
    // @ts-ignore
    v = cachedConfig[key] = defaultConfig[key]; // Repair
  }
  return v === undefined ? def : v;
}

export function getBoolean(key: string, def = false): boolean {
  return !!get(key, def);
}

export function getString(key: string, def = "", nonEmpty = false): string {
  const val = get(key, def);
  if (typeof val === "string") {
    if (!nonEmpty || val.length > 0) {
      return val;
    }
  }
  if (typeof val === "object" && val !== undefined && val !== null) {
    return val.toString();
  }
  return String(val) || def;
}

export function getNumber(key: string, def = 0): number {
  return parseNum(get(key, def), def);
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
  try {
    defaultConfig = Object.freeze(
      JSON.parse(
        (
          await fs.readFile(path.join(DEFAULTS_ROOT, "alicorn.config.json"))
        ).toString()
      )
    );
  } catch (e) {
    console.log(e);
  }
}
export function loadConfigSync(): void {
  try {
    cachedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
  } catch {
    cachedConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE).toString());
  }
  try {
    defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE).toString());
  } catch {}
}

export function saveConfigSync(): void {
  try {
    fs.ensureDirSync(path.dirname(CONFIG_FILE));
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cachedConfig, null, 4), {
      mode: 0o777,
    });
  } catch {}
}

export async function saveConfig(): Promise<void> {
  await fs.ensureDir(path.dirname(CONFIG_FILE));
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cachedConfig, null, 4), {
    mode: 0o777,
  });
}

// DANGEROUS - Will overwrite
export async function saveDefaultConfig(): Promise<void> {
  await fs.ensureDir(path.dirname(CONFIG_FILE));
  const stream = fs
    .createReadStream(DEFAULT_CONFIG_FILE)
    .pipe(fs.createWriteStream(CONFIG_FILE, { mode: 0o777 }));
  return new Promise<void>((resolve, reject) => {
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (e) => {
      reject(e);
    });
  });
}

export function parseNum(val: unknown, def = 0): number {
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

export async function saveAndReloadMain(): Promise<void> {
  await saveConfig();
  ipcRenderer.send("reloadConfig");
}
