import { conf, type UserConfig } from "@/main/conf/conf";
import { Channels } from "@/main/ipc/channels";
import { ipcMain } from "electron";

/**
 * Setup main process handlers for configuration syncing.
 */
function setup() {
    ipcMain.handle(Channels.GET_CONFIG, () => conf());

    ipcMain.handle(Channels.UPDATE_CONFIG, (_, c: UserConfig) => conf.updateWith(c));
}

export const confHost = {
    setup
};
