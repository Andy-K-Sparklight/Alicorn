import type { GameProfile } from "@/main/game/spec";
import { reg } from "@/main/registry/registry";
import { windowControl } from "@/main/sys/window-control";

function emitChange() {
    windowControl.getMainWindow()?.webContents.send("gameChanged");
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
    const g = get(id);

    if (!g) return [];

    return reg.games.getAll()
        .filter(gp => gp.id !== g.id && gp.launchHint.containerId === g.launchHint.containerId)
        .map(gp => gp.id);
}

function get(id: string) {
    return reg.games.get(id);
}

export const games = {
    add, remove, queryShared, get, genId
};

function genId(): string {
    let i = 1;
    while (true) {
        const st = "#" + i;
        if (!reg.games.has(st)) {
            return st;
        }
        i++;
    }
}
