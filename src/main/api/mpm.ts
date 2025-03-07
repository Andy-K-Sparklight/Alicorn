import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import type { MpmManifest } from "@/main/mpm/manifest";
import { modrinth } from "@/main/mpm/modrinth";
import { dlx } from "@/main/net/dlx";
import { alter, uniqueBy } from "@/main/util/misc";

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

ipcMain.handle("addMod", async (_, gameId, id) => {
    console.debug(`Adding mod ${id} for ${gameId}.`);
    const game = games.get(gameId);
    const container = containers.get(game.launchHint.containerId);

    const pseudoManifest: MpmManifest = {
        userPrompt: [{ id, vendor: "modrinth" }],
        resolved: [],
        dependencies: {}
    };

    const tasks = await modrinth.resolve(pseudoManifest, game.versions.game, game.installProps.type, container);
    await dlx.getAll(tasks);

    games.add(alter(game, g => {
        g.mpm.userPrompt = uniqueBy(
            g.mpm.userPrompt.concat(pseudoManifest.userPrompt),
            e => e.id
        );

        g.mpm.resolved = uniqueBy(
            g.mpm.resolved.concat(pseudoManifest.resolved),
            f => f.version
        );

        g.mpm.dependencies = {
            ...g.mpm.dependencies,
            ...pseudoManifest.dependencies
        };
    }));

    console.debug(`Mod ${id} added for ${gameId}.`);
});
