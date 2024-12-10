/**
 * Host server on the main process serving i18n content.
 */
import { ipcMain } from "electron";
import { Channels } from "@/main/ipc/channels";
import fs from "fs-extra";
import { paths } from "@/main/fs/paths";
import YAML from "yaml";

function setup() {
    ipcMain.handle(Channels.LOAD_LANG_RESOURCE, async (_, lng: string, ns: string) => {
        try {
            const d = await fs.readFile(paths.app.get(`i18n/${lng}/${ns}.yml`));
            return YAML.parse(d.toString());
        } catch {
            return {};
        }
    });
}

export const i18nHost = {
    setup
};