import os from "node:os";
import path from "path";
import fs from "fs-extra";
import rfdc from "rfdc";
import { ipcMain } from "electron";
import { Channels } from "@/main/ipc/channels.ts";

/**
 * The config (v2) module which has enhanced type support.
 */
const DEFAULT_CONFIG = {
    /**
     * Whether to enable inspect mode.
     */
    inspect: false,

    /**
     * Paths to override fallback options.
     */
    paths: {
        /**
         * Path to the store root.
         */
        store: ""
    }
};

/**
 * Gets the path to the configuration file.
 *
 * Configuration file uses a separated path resolving strategy than the 'paths' module, as the latter can be picked
 * customized by the user. Using a dedicated path resolution method keeps consistency of the location.
 */
function getConfigPath(): string {
    if (process.env.ALICORN_CONFIG_PATH) return path.resolve(process.env.ALICORN_CONFIG_PATH);

    let root: string;
    switch (os.platform()) {
        case "win32":
            root = path.join(process.env["LOCALAPPDATA"] || process.env["APPDATA"] || os.homedir(), "Alicorn");
            break;
        case "darwin":
            root = path.join(os.homedir(), "Library", "Application Support", "Alicorn");
            break;
        default:
            root = path.join(os.homedir(), ".alicorn");
            break;
    }
    return path.join(root, "config.v2.json");
}

/**
 * Loads the configuration file.
 */
async function load(): Promise<void> {
    const pt = getConfigPath();
    console.log(`Loading config from: ${pt}`);
    try {
        const user = await fs.readJSON(getConfigPath());
        config = applyPatch(DEFAULT_CONFIG, user);
    } catch (e) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === "ENOENT") {
            console.log("Config file does not exist (this is not an error).");
        } else {
            throw e;
        }
    }
}

/**
 * Saves the configuration file.
 */
async function store(): Promise<void> {
    const pt = getConfigPath();
    console.log(`Saving config to: ${pt}`);
    const diff = createPatch(DEFAULT_CONFIG, config);
    if (diff === null) {
        await fs.remove(pt);
    } else {
        await fs.outputJSON(pt, diff, { spaces: 4 });
    }
}

type ConfigSection = string | number | boolean | { [key: string]: ConfigSection; }

const clone = rfdc();

/**
 * Applies the patch object on the base object if type matches.
 *
 * The origin object is not modified. The returned object does not reference contents from the both object.
 */
function applyPatch<T extends ConfigSection>(origin: T, user: T): T {
    if (typeof origin !== "object") {
        // Primitives, no clone needed
        if (typeof user === typeof origin) return user;
        return origin;
    }

    if (typeof user !== "object") return clone(origin);

    const o = Object.assign({}, origin);
    for (const [k, v] of Object.entries(o)) {
        if (!(k in user)) {
            o[k] = clone(v);
        } else {
            o[k] = applyPatch(v, user[k]);
        }
    }

    return o;
}

/**
 * Compares the given objects and gets an object with unchanged keys removed.
 */
function createPatch(origin: ConfigSection, user: ConfigSection): ConfigSection | null {
    let out: ConfigSection = {};
    if (typeof origin !== "object") {
        if (typeof user !== typeof origin) return null;
        return user === origin ? null : user;
    }
    if (typeof user !== "object") return null;

    for (const [k, v] of Object.entries(origin)) {
        if (!(k in user)) continue;
        const dv = createPatch(v, user[k]);
        if (dv != null) {
            out[k] = dv;
        }
    }
    if (Object.keys(out).length > 0) return out;
    return null;
}

let config: UserConfig = clone(DEFAULT_CONFIG);

/**
 * Setup main process handlers for configuration syncing.
 */
function setup() {
    ipcMain.handle(Channels.GET_CONFIG, () => config);

    ipcMain.handle(Channels.UPDATE_CONFIG, (_, c: UserConfig) => {
        config = c;
    });
}

/**
 * The configuration management module.
 *
 * A direct call to the constant gets the active configuration object.
 */
export const conf = Object.assign(() => config, { load, store, setup });

export type UserConfig = typeof DEFAULT_CONFIG;