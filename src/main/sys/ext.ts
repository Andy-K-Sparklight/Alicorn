import { ipcMain, shell } from "electron";
import { Channels } from "@/main/ipc/channels";

function setup() {
    ipcMain.on(Channels.OPEN_URL, (_, url: string) => {
        void shell.openExternal(url, { activate: true });
    });
}

/**
 * Auxiliaries and extensions.
 */
export const ext = {
    setup
};