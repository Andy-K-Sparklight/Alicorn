import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";

/**
 * Events sent from renderer to main.
 */
export type IpcCallEvents = {
    updateConfig: (c: UserConfig) => void;
    showWindow: () => void;
    hideWindow: () => void;
    closeWindow: () => void;
    minimizeWindow: () => void;
    openUrl: (url: string) => void;
    stopGame: (id: string) => void;
    removeGame: (id: string) => void;
    revealGameContent: (id: string, scope: string) => void;
}

/**
 * Events sent from renderer to main with message port forwarding.
 */
export type IpcMessageEvents = {
    installVanilla: (gameId: string) => void;
    subscribeGameEvents: (gid: string) => void;
}

/**
 * Events sent from main to renderer.
 */
export type IpcPushEvents = {
    gameChanged: () => void;
}

export type IpcCommands = {
    getConfig: () => UserConfig;
    selectDir: () => string;
    listGames: () => GameProfile[];
    removeGame: (gameId: string) => void;
    launch: (id: string) => LaunchGameResult;
    gameAuth: (gameId: string) => boolean;
    addGame: (game: CreateGameInit) => void;
    getVersionManifest: () => VersionManifest;
}
