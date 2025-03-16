import { addCheckedHandler } from "@/main/ipc/checked";
import { ipcMain } from "@/main/ipc/typed";
import { dialog, shell } from "electron";

ipcMain.on("openUrl", (_, url: string) => {
    void shell.openExternal(url, { activate: true });
});

addCheckedHandler("selectDir", async () => {
    const { filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory", "createDirectory", "promptToCreate", "dontAddToRecent"]
    });

    return filePaths[0] ?? "";
});

addCheckedHandler("selectFile", async (filters) => {
    const { filePaths } = await dialog.showOpenDialog({
        properties: ["openFile", "dontAddToRecent"],
        filters
    });

    return filePaths[0] ?? "";
});
