import type { GameProfile } from "@/main/game/spec";
import { reg } from "@/main/registry/registry";
import { BrowserWindow } from "electron";

function emitChange() {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send("gameChanged"));
}

/**
 * Add or update the given profile.
 */
function add(profile: GameProfile) {
    reg.games.add(profile.id, profile);
    emitChange();
}

function remove(id: string) {
    reg.games.remove(id);
    emitChange();
}

/**
 * Checks whether the specified game is being installed on the same container with at least one other game.
 */
function queryShared(id: string): string[] {
    const g = reg.games.get(id);

    if (!g) return [];

    return reg.games.getAll()
        .filter(gp => gp.id !== g.id && gp.launchHint.containerId === g.launchHint.containerId)
        .map(gp => gp.id);
}

export const games = {
    add, remove, queryShared
};
