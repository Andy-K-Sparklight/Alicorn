import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import { mpmLock } from "@/main/mpm/lockfile";
import { modrinth } from "@/main/mpm/modrinth";
import { mpm } from "@/main/mpm/pm";

ipcMain.handle("searchMods", async (_, query, gameId, offset) => {
    const game = games.get(gameId);
    const res = await modrinth.search(query, game.versions.game, game.installProps.type, offset);

    return res.map(r => ({
        id: r.project_id,
        vendor: "modrinth",
        title: r.title,
        author: r.author,
        description: r.description,
        icon: r.icon_url || ""
    }));
});


ipcMain.handle("updateMods", async (_, gameId) => {
    await mpm.fullResolve(gameId);
});

ipcMain.handle("addMods", async (_, gameId, specs) => {
    await mpm.addPackages(gameId, specs);
});

ipcMain.handle("removeMods", async (_, gameId, specs) => {
    await mpm.removePackages(gameId, specs);
});

ipcMain.handle("loadMpmManifest", async (_, gameId) => {
    return await mpmLock.loadManifest(gameId);
});
