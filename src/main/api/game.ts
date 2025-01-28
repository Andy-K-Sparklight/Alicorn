import { containers } from "@/main/container/manage";
import { gameInspector } from "@/main/game/inspect";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";
import { shell } from "electron";
import fs from "fs-extra";
import path from "node:path";

ipcMain.handle("listGames", () => reg.games.getAll());
ipcMain.handle("tellGame", (_, gameId) => gameInspector.tellGame(gameId));

const allowedContentScopes = new Set(["resourcepacks"]);

ipcMain.on("revealGameContent", async (_, gameId, scope) => {
    if (!allowedContentScopes.has(scope)) return;
    const game = reg.games.get(gameId);
    const container = containers.get(game.launchHint.containerId);
    const pt = path.join(container.gameDir(), scope);
    try {
        await fs.ensureDir(pt);
        const st = await fs.stat(pt);
        if (st.isDirectory()) {
            void shell.openPath(pt);
        }
    } catch {}
});
