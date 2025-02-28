import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { DetailedAccountProps } from "@/main/auth/types";
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
    setZoom: (value: number) => void;
    openUrl: (url: string) => void;
    stopGame: (id: string) => void;
    removeGame: (id: string) => void;
    destroyGame: (id: string) => void;
    revealGameContent: (id: string, scope: string) => void;
    languageChange: (lang: string) => void;
    cancelInstall: (id: string) => void;
}

/**
 * Events sent from renderer to main with message port forwarding.
 */
export type IpcMessageEvents = {
    installGame: (gameId: string) => void;
    subscribeGameEvents: (gid: string) => void;
}

/**
 * Events sent from main to renderer.
 */
export type IpcPushEvents = {
    gameChanged: () => void;
    accountChanged: () => void;
    configChanged: (c: UserConfig) => void;
    appUpgraded: (version: string) => void;
    devToolsOpened: () => void;
}

export type IpcCommands = {
    getConfig: () => UserConfig;
    selectDir: () => string;
    listGames: () => GameProfile[];
    getGameProfile: (id: string) => GameProfile;
    removeGame: (gameId: string) => void;
    querySharedGames: (id: string) => string[];
    launch: (id: string) => LaunchGameResult;
    gameAuth: (gameId: string) => void;
    listAccounts: () => DetailedAccountProps[];
    createVanillaAccount: () => DetailedAccountProps | null;
    addGame: (game: CreateGameInit) => void;
    updateGame: (game: GameProfile) => void;
    getVersionManifest: () => VersionManifest;
    queryAvailableModLoaders: (gameVersion: string) => string[];
}
