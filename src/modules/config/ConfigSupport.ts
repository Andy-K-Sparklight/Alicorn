import { ipcRenderer } from "electron";
import fs, { moveSync, removeSync, statSync } from "fs-extra";
import os from "os";
import path from "path";
import { DEFAULTS_ROOT } from "./DataSupport";
import { getOSSpecificDataDir } from "./OSDirSupport";
import { getBasePath } from "./PathSolve";

const CONFIG_FILE = path.resolve(getOSSpecificDataDir(), "alicorn.config.json");

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
    const v = cachedConfig[key];
    return v === undefined ? def : v;
}

function fixConfig(
    cur: Record<string, unknown>,
    def: Record<string, unknown>
): void {
    const curKeys = Object.keys(cur);
    const defKeys = Object.keys(def);
    for (const k of defKeys) {
        if (!k.endsWith("?") && !curKeys.includes(k)) {
            cur[k] = def[k];
        }
    }
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
    if (typeof val === "object" && val !== null) {
        return val.toString();
    }
    return String(val) || def;
}

export function getNumber(key: string, def = 0): number {
    return parseNum(get(key, def), def);
}

export async function loadConfig(): Promise<void> {
    try {
        cachedConfig = JSON.parse((await fs.readFile(CONFIG_FILE)).toString());
    } catch {
        try {
            cachedConfig = JSON.parse(
                (await fs.readFile(DEFAULT_CONFIG_FILE)).toString()
            );
        } catch (e) {
            console.log(e);
            return;
        }
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
        return;
    }
    fixConfig(cachedConfig, defaultConfig);
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
    fixConfig(cachedConfig, defaultConfig);
}

export async function saveConfig(): Promise<void> {
    const dat = JSON.stringify(cachedConfig, null, 4);
    await fs.outputFile(CONFIG_FILE, dat, {
        mode: 0o777
    });
}

// DANGEROUS - Will overwrite
export async function saveDefaultConfig(): Promise<void> {
    await fs.ensureDir(path.dirname(CONFIG_FILE));
    const stream = fs
        .createReadStream(DEFAULT_CONFIG_FILE)
        .pipe(fs.createWriteStream(CONFIG_FILE, {mode: 0o777}));
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

export function movOldConfigFolderSync(): void {
    const oldDir = path.resolve(os.homedir(), "alicorn");
    const newDir = path.resolve(getOSSpecificDataDir());
    try {
        const sto = statSync(oldDir);
        try {
            const stn = statSync(newDir);
            if (stn.isDirectory()) {
                // Already exists
                return;
            }
        } catch {}
        if (sto.isDirectory()) {
            removeSync(newDir);
            moveSync(oldDir, newDir);
            console.log("Old config path detected, moved to new path.");
        }
    } catch {}
}
