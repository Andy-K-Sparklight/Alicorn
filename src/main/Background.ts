import { ipcMain } from "electron";
import { getMainWindow } from "./Bootstrap";

export function registerBackgroundListeners(): void {
  ipcMain.on("closeWindow", () => {
    console.log("Closing window!");
    getMainWindow()?.close();
  });
  ipcMain.on("openDevTools", () => {
    getMainWindow()?.webContents.openDevTools();
  });
}
