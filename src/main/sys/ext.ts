import { Channels } from "@/main/ipc/channels";
import { dialog, ipcMain, shell } from "electron";

function setup() {
    ipcMain.on(Channels.OPEN_URL, (_, url: string) => {
        void shell.openExternal(url, { activate: true });
    });

    ipcMain.handle(Channels.SELECT_DIR, async () => {
        const { filePaths } = await dialog.showOpenDialog({
            properties: ["openDirectory", "createDirectory", "promptToCreate", "dontAddToRecent"]
        });

        return filePaths[0] ?? "";
    });
}

/**
 * Auxiliaries and extensions.
 */
export const ext = {
    setup
};