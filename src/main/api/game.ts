import { containerInspector } from "@/main/container/inspect";
import { containers } from "@/main/container/manage";
import type { ContainerProps } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { games } from "@/main/game/manage";
import type { GameProfile } from "@/main/game/spec";
import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";
import { shell } from "electron";
import fs from "fs-extra";

ipcMain.handle("listGames", () => reg.games.getAll());
ipcMain.handle("removeGame", (_, gameId) => games.remove(gameId));
ipcMain.handle("getGameProfile", (_, id) => reg.games.get(id));

const allowedContentScopes = new Set(["resourcepacks", "."]);

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
    accountId: string | null;
    assetsLevel: "full" | "video-only";
    containerId?: string;
    containerShouldLink: boolean; // Only present when creating dedicated container
}

ipcMain.handle("addGame", async (_, init) => {
    const { name, profileId, containerId, assetsLevel, containerShouldLink } = init;

    const vm = await vanillaInstaller.getManifest();

    const p = vm.versions.find(v => v.id === profileId)!;

    let cid = containerId;

    if (!cid) {
        const props = await genContainerProps();
        cid = props.id;

        props.flags = {
            link: containerShouldLink
        };

        reg.containers.add(cid, props);
    }

    const type = ({
        "release": "vanilla-release",
        "snapshot": "vanilla-snapshot",
        "old_alpha": "vanilla-old-alpha",
        "old_beta": "vanilla-old-beta"
    } as const)[p.type] ?? "unknown";

    const g: GameProfile = {
        id: genGameId(),
        name,
        installed: false,
        installProps: {
            type: "vanilla"
        },
        launchHint: {
            accountId: init.accountId ?? "",
            containerId: cid,
            profileId,
            pref: {} // TODO allow user to choose pref
        },
        assetsLevel,
        time: Date.now(),
        versions: {
            game: p.id
        },
        type
    };

    games.add(g);
});

ipcMain.handle("updateGame", (_, g) => games.add(structuredClone(g)));

function genGameId(): string {
    let i = 1;
    while (true) {
        const st = "#" + i;
        if (!reg.games.has(st)) {
            return st;
        }
        i++;
    }
}

async function genContainerProps(): Promise<ContainerProps> {
    let dirs: string[] = [];

    try {
        dirs = await fs.readdir(paths.game.to());
    } catch {}

    let i = 1;
    let st: string;

    while (true) {
        st = "#" + i;
        if (!reg.containers.has(st) && !dirs.includes(st)) {
            break;
        }
        i++;
    }

    return {
        id: st,
        root: paths.game.to(st),
        flags: {}
    };
}
