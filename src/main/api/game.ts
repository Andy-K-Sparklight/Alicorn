import { accounts } from "@/main/auth/manage";
import { TemporalAccount } from "@/main/auth/temp";
import { containerInspector } from "@/main/container/inspect";
import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import type { GameCoreType, GameProfile } from "@/main/game/spec";
import type { InstallerProps } from "@/main/install/installers";
import { vanillaInstaller } from "@/main/install/vanilla";
import { addCheckedHandler } from "@/main/ipc/checked";
import { ipcMain } from "@/main/ipc/typed";
import { venv } from "@/main/launch/venv";
import { gameMigrator } from "@/main/migrate/game";
import { reg } from "@/main/registry/registry";
import { shell } from "electron";
import fs from "fs-extra";
import path from "node:path";

ipcMain.handle("listGames", () => reg.games.getAll());
ipcMain.handle("removeGame", (_, gameId) => games.remove(gameId));

addCheckedHandler("getGameProfile", id => games.get(id));

const allowedContentScopes = new Set(["resourcepacks", ".", "logs/latest.log"]);

ipcMain.on("revealGameContent", async (_, gameId, scope) => {
    if (!allowedContentScopes.has(scope)) return;

    const game = games.get(gameId);
    const container = containers.get(game.launchHint.containerId);

    container.props.root = await venv.getCurrentRoot(container);

    if (scope !== "logs/latest.log") {
        await containerInspector.createContentDir(container, scope);
    }
    void shell.openPath(container.content(scope));
});

export interface CreateGameInit {
    /**
     * Optional ID to override existing game.
     */
    id?: string;
    name: string;
    gameVersion: string;
    authType: "online" | "manual";
    installProps: InstallerProps;
    playerName: string;
    accountId: string | null;
    assetsLevel: "full" | "video-only";
    containerId?: string;
    containerShouldLink: boolean; // Only present when creating dedicated container
}

ipcMain.handle("addGame", async (_, init) => {
    const { name, gameVersion, containerId, assetsLevel, containerShouldLink, installProps } = init;

    const vm = await vanillaInstaller.getManifest();

    const p = vm.versions.find(v => v.id === gameVersion)!;

    let cid = containerId;

    if (!cid) {
        const props = await containers.genContainerProps();
        cid = props.id;

        props.flags = {
            link: containerShouldLink
        };

        containers.add(props);
    }

    let type: GameCoreType = ({
        "release": "vanilla-release",
        "snapshot": "vanilla-snapshot",
        "old_alpha": "vanilla-old-alpha",
        "old_beta": "vanilla-old-beta"
    } as const)[p.type] ?? "unknown";

    if (
        installProps.type === "fabric" ||
        installProps.type === "quilt" ||
        installProps.type === "neoforged" ||
        installProps.type === "forge" ||
        installProps.type === "rift" ||
        installProps.type === "liteloader" ||
        installProps.type === "optifine"
    ) {
        type = installProps.type;
    }

    let accountId = "";
    switch (init.authType) {
        case "manual": {
            const a = new TemporalAccount(init.playerName);
            accounts.add(a);
            accountId = a.uuid;
            break;
        }

        case "online": {
            accountId = init.accountId ?? "";
        }
    }

    const g: GameProfile = {
        id: init.id || games.genId(),
        name,
        installed: false,
        installProps,
        launchHint: {
            accountId,
            containerId: cid,
            profileId: "", // Will be re-assigned after installation
            pref: {} // TODO allow user to choose pref
        },
        assetsLevel,
        time: Date.now(),
        versions: {
            game: p.id
        },
        user: {},
        type
    };

    games.add(g);

    return g.id;
});

ipcMain.handle("updateGame", (_, g) => games.add(g));

ipcMain.on("destroyGame", async (_, id) => {
    if (games.queryShared(id).length > 0) return;

    const g = games.get(id);

    if (g) {
        games.remove(g.id);
        // Containers and accounts will be purged when saving registries

        const root = containers.get(g.launchHint.containerId).props.root;
        await fs.remove(root);
    }
});

ipcMain.handle("querySharedGames", async (_, id) => games.queryShared(id));

ipcMain.handle("scanImportableProfiles", async (_, fp) => gameMigrator.scanImportableProfiles(fp));

ipcMain.handle("importGame", async (_, name: string, root, profileId, accountId) => {
    const fp = path.join(root, "versions", profileId, profileId + ".json");
    await gameMigrator.doImport(name, fp, accountId === "new" ? "" : accountId);
});
