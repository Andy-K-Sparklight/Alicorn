import { containerInspector } from "@/main/container/inspect";
import { containers } from "@/main/container/manage";
import type { ContainerSpec } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { gameInspector } from "@/main/game/inspect";
import type { GameProfile } from "@/main/game/spec";
import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";
import { shell } from "electron";
import { nanoid } from "nanoid";

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

export interface CreateGameInit {
    name: string;
    profileId: string;
    containerId?: string;
}

ipcMain.handle("addGame", async (_, init) => {
    const { name, profileId, containerId } = init;

    let cid = containerId;

    if (!cid) {
        cid = nanoid();
        const spec: ContainerSpec = {
            id: cid,
            root: paths.game.to(cid),
            flags: {} // TODO add support for linking
        };
        reg.containers.add(cid, spec);
    }

    const g: GameProfile = {
        id: nanoid(),
        name,
        installed: false,
        launchHint: {
            accountId: "", // TODO update ID when other account types are added
            containerId: cid,
            profileId,
            pref: {} // TODO allow user to choose pref
        },
        time: Date.now()
    };

    reg.games.add(g.id, g);

    const c = containers.get(cid);

    // TODO it may be possible to delay the installation to launch stage
    // This can be helpful when creating games with mod loaders
    // Implement it and then remove this
    await vanillaInstaller.installProfile(profileId, c);
});
