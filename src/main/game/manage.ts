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

export const games = {
    add, remove
};
