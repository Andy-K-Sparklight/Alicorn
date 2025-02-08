/**
 * A standalone script bundled with Alicorn. Does the following jobs:
 *
 * 1. Finds an existing copy of app bundle (with later compatible version) at specified path.
 * 2. If the bundle could not be found, boots using built-in app resources.
 * 3. If a bundle is found, loads main module from it.
 */
import { update } from "@/main/sys/update";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as semver from "semver";
import pkg from "~/package.json";


async function findModulePath(): Promise<string | null> {
    const d = update.getVariableAppDir();
    const files = await fs.readdir(d);

    for (const v of files) {
        if (semver.satisfies(v, "^" + pkg.version)) {
            try {
                const lock = await fs.readFile(path.join(d, v, "install.lock"));

                if (lock.toString() === "OK") {
                    console.debug("Found compatible module: " + v);
                    return path.join(d, v);
                }
            } catch {}
        }
    }

    return null;
}

async function boot() {
    console.log(`Alicorn BL ${pkg.version}`);

    if (!import.meta.env.AL_DEV && !import.meta.env.AL_TEST) {
        try {
            const mp = await findModulePath();
            if (mp) {
                console.debug("Booting from " + mp);
                await import(pathToFileURL(path.join(mp, "main.js")).toString());
                return;
            }
        } catch {}
    }

    console.debug("Booting using built-in module.");
    await import(pathToFileURL(path.join(import.meta.dirname, "main.js")).toString());
}

// Using await here to prevent Electron being initialized too early
// This ensures that app will only emit "ready" event after main script has been executed.
await boot();
