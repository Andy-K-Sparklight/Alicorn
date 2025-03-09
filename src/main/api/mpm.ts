import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import { mpmLock } from "@/main/mpm/lockfile";
import { modrinth } from "@/main/mpm/modrinth";
import { mpm } from "@/main/mpm/pm";

ipcMain.handle("searchAddons", async (_, scope, query, gameId, offset) => {
    const game = games.get(gameId);
    return await modrinth.search(scope, query, game.versions.game, game.installProps.type, offset);
});


ipcMain.handle("updateAddons", async (_, gameId) => {
    await mpm.fullResolve(gameId);
});

ipcMain.handle("addAddons", async (_, gameId, specs) => {
    await mpm.addPackages(gameId, specs);
});

ipcMain.handle("removeAddons", async (_, gameId, specs) => {
    await mpm.removePackages(gameId, specs);
});

ipcMain.handle("loadMpmManifest", async (_, gameId) => {
    return await mpmLock.loadManifest(gameId);
});
