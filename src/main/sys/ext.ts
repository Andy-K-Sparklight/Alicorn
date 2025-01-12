import { Channels } from "@/main/ipc/channels";
import { ipcMain, shell } from "electron";

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