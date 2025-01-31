import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";

ipcMain.handle("getVersionManifest", () => vanillaInstaller.getManifest());
