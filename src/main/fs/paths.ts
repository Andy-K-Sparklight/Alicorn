/**
 * Path management module.
 */
import { conf } from "@/main/conf/conf";
import { app } from "electron";
import os from "node:os";
import path from "node:path";

interface PathResolver {
    /**
     * Resolves a path in this path partition.
     * @param rel Relative path segments.
     */
    to(...rel: string[]): string;
}

/**
 * Creates a resolver based on the given root path as the section.
 * @param rootProvider The root directory or a function that provides a path as the root directory.
 */
function createResolver(rootProvider: string | (() => string)): PathResolver {
    if (typeof rootProvider === "string") {
        return {
            to: (...rel) => path.normalize(path.resolve(rootProvider, ...rel))
        };
    } else {
        return {
            to: (...rel) => path.normalize(path.resolve(rootProvider(), ...rel))
        };
    }
}

/**
 * Finds an optimal location for storing app files.
 */
function optimalStoreRoot(): string {
    switch (os.platform()) {
        case "win32":
            return path.join(process.env["LOCALAPPDATA"] || process.env["APPDATA"] || os.homedir(), "Alicorn");
        case "darwin":
            return path.join(os.homedir(), "Library", "Application Support", "Alicorn");
        default:
            return path.join(os.homedir(), ".alicorn");
    }
}

/**
 * Finds an optimal location for game files.
 */
function optimalGameRoot(): string {
    return path.join(getStoreRoot(), "game");
}

/**
 * Init options for the paths module.
 */
interface PathsInit {
    /**
     * The root directory of the store (managed by Alicorn).
     */
    storeRoot: string;

    /**
     * The root directory of the game containers.
     */
    gameRoot: string;

    /**
     * The root directory for storing temporary files.
     */
    tempRoot: string;

    /**
     * Path to the script bundle.
     */
    appPath: string;
}

let initPrompt: Partial<PathsInit> | null = null;

/**
 * Setup path resolvers with the given prompts.
 * @param init Init prompts.
 */
function setup(init?: Partial<PathsInit>): void {
    console.log("Configuring paths...");

    initPrompt = init ?? null;

    if (!conf().paths.store) {
        conf.alter(c => c.paths.store = optimalStoreRoot());
        console.log(`Store path set to ${conf().paths.store}`);
    }

    if (!conf().paths.game) {
        conf.alter(c => c.paths.game = optimalGameRoot());
        console.log(`Game path set to ${conf().paths.game}`);
    }

    if (!conf().paths.temp) {
        conf.alter(c => c.paths.temp = path.resolve(app.getPath("temp"), "Alicorn"));
        console.log(`Temp path set to ${conf().paths.temp}`);
    }
}

/**
 * Gets the path to the store root on the fly.
 */
function getStoreRoot() {
    return initPrompt?.storeRoot || conf().paths.store;
}

/**
 * Gets the path to the game containers.
 */
function getGameRoot() {
    return initPrompt?.gameRoot || conf().paths.game;
}

/**
 * Gets the path to the temp directory.
 */
function getTempRoot() {
    return initPrompt?.tempRoot || conf().paths.temp;
}

/**
 * Path resolution module.
 */
export const paths = {
    /**
     * Configure default paths.
     */
    setup,

    /**
     * Stores support files and registries.
     */
    store: createResolver(() => getStoreRoot()),

    /**
     * Stores reusable files for ALink.
     */
    alink: createResolver(() => path.join(getGameRoot(), ".alink")),

    /**
     * Stores game files.
     */
    game: createResolver(() => getGameRoot()),

    /**
     * Stores app files.
     *
     * On some platforms this path is not writable. Avoid making changes to it.
     */
    app: createResolver(() => import.meta.dirname),

    /**
     * Stores temp files.
     */
    temp: createResolver(() => getTempRoot())
};
