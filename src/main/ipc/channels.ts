import type { UserConfig } from "@/main/conf/conf";

export type IpcEvents = {
    updateConfig: (c: UserConfig) => void;
    showWindow: () => void;
    hideWindow: () => void;
    closeWindow: () => void;
    minimizeWindow: () => void;
    openUrl: (url: string) => void;
}

export type IpcCommands = {
    getConfig: () => UserConfig;
    selectDir: () => string;
}
