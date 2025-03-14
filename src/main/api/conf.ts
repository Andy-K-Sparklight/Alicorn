import { conf, type UserConfig } from "@/main/conf/conf";
import { addCheckedHandler } from "@/main/ipc/checked";
import { ipcMain } from "@/main/ipc/typed";

addCheckedHandler("getConfig", () => conf());

ipcMain.on("updateConfig", (_, c: UserConfig) => conf.update(c));
