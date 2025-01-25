import { conf, type UserConfig } from "@/main/conf/conf";
import { ipcMain } from "@/main/ipc/typed";

/**
 * Setup main process handlers for configuration syncing.
 */
function setup() {
    ipcMain.handle("getConfig", () => conf());

    ipcMain.on("updateConfig", (_, c: UserConfig) => conf.updateWith(c));
}

export const confHost = {
    setup
};
