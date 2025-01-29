import { conf, type UserConfig } from "@/main/conf/conf";
import { ipcMain } from "@/main/ipc/typed";

ipcMain.handle("getConfig", () => conf());

ipcMain.on("updateConfig", (_, c: UserConfig) => conf.updateWith(c));
