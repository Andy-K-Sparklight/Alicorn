import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile, GameProfileDetail } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";

export type IpcEvents = {
    updateConfig: (c: UserConfig) => void;
    showWindow: () => void;
    hideWindow: () => void;
    closeWindow: () => void;
    minimizeWindow: () => void;
    openUrl: (url: string) => void;
    subscribeGameEvents: (gid: string) => void;
    stopGame: (id: string) => void;
    removeGame: (id: string) => void;
    revealGameContent: (id: string, scope: string) => void;

    installVanilla: (gameId: string) => void; // Called via 'postMessage'
}

export type IpcCommands = {
    getConfig: () => UserConfig;
    selectDir: () => string;
    listGames: () => GameProfile[];
    tellGame: (gameId: string) => GameProfileDetail;
    launch: (id: string) => LaunchGameResult;
    gameAuth: (gameId: string) => boolean;
    addGame: (game: CreateGameInit) => void;
    getVersionManifest: () => VersionManifest;
}
