import { ipcMain } from "@/main/ipc/typed";
import { dialog, shell } from "electron";

function setup() {
    ipcMain.on("openUrl", (_, url: string) => {
        void shell.openExternal(url, { activate: true });
    });

    ipcMain.handle("selectDir", async () => {
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
