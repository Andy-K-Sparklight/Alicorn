/**
 * Window management module.
 */

import { ipcMain } from "@/main/ipc/typed";
import { type BrowserWindow, screen } from "electron";

const allowedWindows = new Set<BrowserWindow>();

/**
 * Setup listeners.
 */
function setup() {
    ipcMain.on("showWindow", (e) => getWindow(e.sender.id)?.show());
    ipcMain.on("hideWindow", (e) => getWindow(e.sender.id)?.hide());
    ipcMain.on("minimizeWindow", (e) => getWindow(e.sender.id)?.minimize());
    ipcMain.on("closeWindow", (e) => getWindow(e.sender.id)?.close());
}

/**
 * Gets the window by the ID of its web contents.
 * @param id Web contents ID.
 */
function getWindow(id: number): BrowserWindow | null {
    for (const w of allowedWindows) {
        if (w.webContents.id === id) return w;
    }
    return null;
}


/**
 * Enable window management API for the given window.
 */
function forWindow(w: BrowserWindow) {
    allowedWindows.add(w);

    // Revoke the listeners once closed
    w.once("closed", () => allowedWindows.delete(w));
}

/**
 * Gets an optimal window size for the main window.
 *
 * This function sizes the window based on the size of the primary display, with the fixed aspect ratio 16:10 and scale
 * factor 0.6.
 */
function optimalSize(): [number, number] {
    let { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const ratio = width / height;
    const expRatio = 16 / 10;
    if (ratio > expRatio) {
        width = height * expRatio;
    } else {
        height = width / expRatio;
    }

    const scaleFactor = 0.8;

    return [Math.round(width * scaleFactor), Math.round(height * scaleFactor)];
}

export const windowControl = { setup, forWindow, optimalSize };
