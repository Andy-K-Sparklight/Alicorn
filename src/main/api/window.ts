import { ipcMain } from "@/main/ipc/typed";
import { BrowserWindow } from "electron";

ipcMain.on("showWindow", (e) => getWindow(e.sender.id)?.show());
ipcMain.on("hideWindow", (e) => getWindow(e.sender.id)?.hide());
ipcMain.on("minimizeWindow", (e) => getWindow(e.sender.id)?.minimize());
ipcMain.on("closeWindow", (e) => getWindow(e.sender.id)?.close());

function getWindow(id: number): BrowserWindow | null {
    return BrowserWindow.getAllWindows().find(w => w.webContents.id === id) ?? null;
}
