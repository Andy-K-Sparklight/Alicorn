import { containerInspector } from "@/main/container/inspect";
import { containers } from "@/main/container/manage";
import { gameInspector } from "@/main/game/inspect";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";
import { shell } from "electron";

ipcMain.handle("listGames", () => reg.games.getAll());
ipcMain.handle("tellGame", (_, gameId) => gameInspector.tellGame(gameId));

const allowedContentScopes = new Set(["resourcepacks"]);

ipcMain.on("revealGameContent", async (_, gameId, scope) => {
    if (!allowedContentScopes.has(scope)) return;

    const game = reg.games.get(gameId);
    const container = containers.get(game.launchHint.containerId);

    await containerInspector.createContentDir(container, scope);
    void shell.openPath(container.content(scope));
});

ipcMain.handle("addGame", (_, game) => reg.games.add(game.id, game));
