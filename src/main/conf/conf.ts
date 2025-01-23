import fs from "fs-extra";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";

/**
 * The config (v2) module which has enhanced type support.
 */
const DEFAULT_CONFIG = {
    /**
     * Development related settings.
     */
    dev: {
        /**
         * Enable DevTools in production mode. (DevTools is enabled in development mode anyway)
         */
        devTools: false,

        /**
         * Display window frame.
         */
        showFrame: false
    },

    /**
     * User preferences.
     */
    pref: {
        /**
         * Customizable username.
         */
        username: os.userInfo().username
    },

    /**
     * Paths to override fallback options.
     */
    paths: {
        /**
         * Path to the store root.
         */
        store: "",

        /**
         * Path to the game containers.
         */
        game: "",

        /**
         * Path to store temp files.
         */
        temp: ""
    },

    /**
     * Network related options,
     */
    net: {
        /**
         * The preferred downloader.
         *
         * Values: aria2, next
         */
        downloader: "aria2",

        /**
         * Whether to validate files after download.
         */
        validate: true,

        /**
         * The maximum concurrency.
         */
        concurrency: 16,

        /**
         * Options for aria2.
         */
        aria2: {
            /**
             * Maximum tries for each download task.
             */
            tries: 3,

            /**
             * Extra arguments passed to aria2c during startup.
             *
             * Values are separated by line breaks.
             */
            args: [] as string[],

            /**
             * Maximum wait time (sec) before aborting a request. 0 or negative values are not accepted.
             */
            requestTimeout: 5,

            /**
             * Maximum wait time (sec) when the stream is halted (i.e. no bytes are transferred) before aborting
             * the download.
             */
            transferTimeout: 10
        },

        /**
         * Options for the next downloader.
         */
        next: {
            /**
             * Maximum tries for each download task.
             */
            tries: 3,

            /**
             * Maximum wait time (ms) before aborting a request. 0 or negative value indicates infinite wait time.
             */
            requestTimeout: 5000,

            /**
             * Minimum acceptable transfer speed when downloading files.
             */
            minSpeed: 64 * 1024
        },

        /**
         * Mirror related operations.
         */
        mirror: {
            /**
             * Whether to apply mirror rules for speeding download.
             */
            enable: true,

            /**
             * Whether to bench mirrors on startup.
             */
            bench: true,

            /**
             * The preferred mirror.
             *
             * This option can be changed when benching.
             */
            prefer: "vanilla"
        },

        /**
         * NFAT reuse options.
         */
        nfat: {
            /**
             * Whether to allow NFAT to record files and reuse them when necessary.
             */
            enable: true
        }
    },

    /**
     * Launcher client properties.
     */
    client: {
        /**
         * The ID to identify the client.
         */
        id: randomUUID().replaceAll("-", "")
    },

    /**
     * Runtime properties.
     */
    runtime: {
        /**
         * Global additional arguments.
         */
        args: {
            vm: [] as string[],
            game: [] as string[]
        },

        /**
         * The maximum lines of logs to be kept in buffer for scrolling back.
         */
        logsLimit: 10000
    },

    /**
     * Java runtime management related options.
     */
    jrt: {
        /**
         * Remove documents and corresponding links to speed up download.
         *
         * This drastically improves the installation of the runtime and should not be disabled in common scenarios.
         */
        filterDocs: true
    },

    /**
     * Application settings.
     */
    app: {
        /**
         * Window related controls.
         */
        window: {
            /**
             * Window size.
             */
            size: [] as number[],

            /**
             * Window position.
             */
            pos: [] as number[]
        }
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
        const d = (await fs.readFile(getConfigPath())).toString();
        if (d.trim().length > 0) {
            config = applyPatch(DEFAULT_CONFIG, JSON.parse(d));
        }
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

type ConfigSection = string | number | boolean | string[] | number[] | boolean[] | ConfigSectionObject;
type ConfigSectionObject = { [key: string]: ConfigSection; }

/**
 * Applies the patch object on the base object if type matches.
 *
 * The origin object is not modified. The returned object does not reference contents from the both object.
 */
function applyPatch<T extends ConfigSection>(origin: T, user: T): T {
    // Primitives, no clone needed
    if (typeof origin !== "object") {
        if (typeof user === typeof origin) return user;
        return origin;
    }

    // Filter out other primitives
    if (typeof user !== "object") return structuredClone(origin);

    // Arrays work like primitives
    if (Array.isArray(origin)) {
        if (Array.isArray(user)) return user.concat() as T;
        return origin.concat() as T;
    }

    // Filter out other arrays
    if (Array.isArray(user)) return structuredClone(origin);

    // Assign objects
    const o = Object.assign({}, origin) as ConfigSectionObject;
    for (const [k, v] of Object.entries(o)) {
        if (!(k in user)) {
            o[k] = structuredClone(v);
        } else {
            o[k] = applyPatch(v, (user as ConfigSectionObject)[k]);
        }
    }

    return o as T;
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

    if (Array.isArray(origin)) {
        if (!Array.isArray(user)) return null;
        if (origin.length === user.length && origin.every((v, i) => user[i] == v)) {
            return null;
        }
        return user;
    }

    if (Array.isArray(user)) return null;

    for (const [k, v] of Object.entries(origin)) {
        if (!(k in user)) continue;
        const dv = createPatch(v, (user as ConfigSectionObject)[k]);
        if (dv != null) {
            out[k] = dv;
        }
    }
    if (Object.keys(out).length > 0) return out;
    return null;
}

let config: UserConfig = structuredClone(DEFAULT_CONFIG);

function updateWith(c: UserConfig) {
    Object.assign(config, c);
}

/**
 * The configuration management module.
 *
 * A direct call to the constant gets the active configuration object.
 */
export const conf = Object.assign(() => config, { load, store, updateWith });

export type UserConfig = typeof DEFAULT_CONFIG;
