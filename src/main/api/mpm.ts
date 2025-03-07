import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import { modrinth } from "@/main/mpm/modrinth";

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
