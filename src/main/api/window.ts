import { BrowserWindow } from "electron";
import { ipcMain } from "@/main/ipc/typed";

ipcMain.on("showWindow", e => BrowserWindow.fromWebContents(e.sender)?.show());
ipcMain.on("hideWindow", e => BrowserWindow.fromWebContents(e.sender)?.hide());
ipcMain.on("minimizeWindow", e => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on("closeWindow", e => BrowserWindow.fromWebContents(e.sender)?.close());

ipcMain.on("setZoom", (e, v) => {
    const rv = v / 100;
    e.sender.setZoomFactor(rv);
});
