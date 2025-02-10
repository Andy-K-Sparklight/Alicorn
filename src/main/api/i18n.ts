import { ipcMain } from "@/main/ipc/typed";
import { i18nMain } from "@/main/util/i18n";

ipcMain.on("languageChange", (_, lang) => {
    i18nMain.language = lang;
});
