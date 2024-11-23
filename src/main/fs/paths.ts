/**
 * Path management module.
 */
import path from "node:path";
import os from "node:os";
import { conf } from "@/main/conf/conf.ts";
import { app } from "electron";

interface PathResolver {
    /**
     * Resolves a path in this path partition.
     * @param rel Relative path segments.
     */
    get(...rel: string[]): string;
}

/**
 * Creates a resolver based on the given root path as the section.
 * @param rootProvider The root directory or a function that provides a path as the root directory.
 */
function createResolver(rootProvider: string | (() => string)): PathResolver {
    if (typeof rootProvider === "string") {
        return {
            get: (...rel) => path.normalize(path.resolve(rootProvider, ...rel))
        };
    } else {
        return {
            get: (...rel) => path.normalize(path.resolve(rootProvider(), ...rel))
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
 * Init options for the paths module.
 */
interface PathsInit {
    /**
     * The root directory of the store (managed by Alicorn).
     */
    storeRoot: string;
}

let initPrompt: Partial<PathsInit> | null = null;
let fallbackStoreRoot = "";

/**
 * Setup path resolvers with the given prompts.
 * @param init Init prompts.
 */
function setup(init?: Partial<PathsInit>): void {
    console.log("Configuring paths...");

    initPrompt = init ?? null;
    fallbackStoreRoot = optimalStoreRoot();

    console.log(`Fallback store path: ${fallbackStoreRoot}`);
}

/**
 * Gets the path to the store root on the fly.
 */
function getStoreRoot() {
    return process.env.ALICORN_STORE_PATH || initPrompt?.storeRoot || conf().paths.store || fallbackStoreRoot;
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
     * Stores app files.
     *
     * On some platforms this path is not writable. Avoid making changes to it.
     */
    app: createResolver(() => app.getAppPath())
};