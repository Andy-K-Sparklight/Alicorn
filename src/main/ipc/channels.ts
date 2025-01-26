import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile } from "@/main/game/spec";

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
}

export type IpcCommands = {
    getConfig: () => UserConfig;
    selectDir: () => string;
    listGames: () => GameProfile[];
    launch: (id: string) => string;
}
