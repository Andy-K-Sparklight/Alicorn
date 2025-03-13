import type { GameAuthResult } from "@/main/api/auth";
import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { MpmAddonSearchResult } from "@/main/api/mpm";
import type { DetailedAccountProps } from "@/main/auth/types";
import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";
import type { MpmAddonType, MpmManifest } from "@/main/mpm/spec";

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
    mpmManifestChanged: (id: string, mf: MpmManifest) => void;
}

export type IpcCommands = {
    getConfig: () => UserConfig;
    selectDir: () => string;
    listGames: () => GameProfile[];
    removeGame: (gameId: string) => void;
    querySharedGames: (id: string) => string[];
    launch: (id: string) => LaunchGameResult;
    gameAuth: (gameId: string, pwd?: string) => GameAuthResult;
    listAccounts: () => DetailedAccountProps[];
    createVanillaAccount: () => DetailedAccountProps;
    createYggdrasilAccount: (host: string, email: string, pwd: string) => DetailedAccountProps;
    addGame: (game: CreateGameInit) => string;
    updateGame: (game: GameProfile) => void;
    getVersionManifest: () => VersionManifest;
    queryAvailableModLoaders: (gameVersion: string) => string[];
    loadMpmManifest: (gameId: string) => MpmManifest;
    searchAddons: (scope: MpmAddonType, query: string, gameId: string, pagination: any) => MpmAddonSearchResult;
    updateAddons: (gameId: string) => void;
    addAddons: (gameId: string, specs: string[]) => void;
    removeAddons: (gameId: string, specs: string[]) => void;
    getAccountSkin: (accountId: string) => string;
    getAccountSkinAvatar: (accountId: string) => [string, string];
    scanImportableProfiles: (root: string) => string[];
    importGame: (name: string, root: string, profileId: string, accountId: string) => void;
}
