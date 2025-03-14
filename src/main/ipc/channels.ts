import type { UserConfig } from "@/main/conf/conf";
import type { MpmManifest } from "@/main/mpm/spec";

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

export type IpcCommands = {}
