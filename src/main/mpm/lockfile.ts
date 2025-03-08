import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import type { MpmManifest } from "@/main/mpm/pm";
import { windowControl } from "@/main/sys/window-control";
import { isENOENT } from "@/main/util/fs";
import fs from "fs-extra";

async function loadManifest(gameId: string): Promise<MpmManifest> {
    try {
        const game = games.get(gameId);
        const c = containers.get(game.launchHint.containerId);
        return await fs.readJSON(c.mpmLockfile());
    } catch (e) {
        if (isENOENT(e)) {
            return {
                userPrompt: [],
                resolved: []
            };
        } else {
            throw e;
        }
    }
}

function notifyManifestChanged(gameId: string, manifest: MpmManifest) {
    windowControl.getMainWindow()?.webContents.send("mpmManifestChanged", gameId, manifest);
}

async function saveManifest(gameId: string, manifest: MpmManifest) {
    notifyManifestChanged(gameId, manifest);
    const game = games.get(gameId);
    const c = containers.get(game.launchHint.containerId);
    await fs.outputJSON(c.mpmLockfile(), manifest);
}

export const mpmLock = { loadManifest, saveManifest };
