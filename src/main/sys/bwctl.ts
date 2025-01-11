/**
 * Window management module.
 */

import { conf } from "@/main/conf/conf";
import { Channels } from "@/main/ipc/channels";
import { type BrowserWindow, ipcMain, screen } from "electron";

const allowedWindows = new Set<BrowserWindow>();


/**
 * Setup listeners.
 */
function setup() {
    ipcMain.on(Channels.SHOW_WINDOW, (e) => getWindow(e.sender.id)?.show());
    ipcMain.on(Channels.HIDE_WINDOW, (e) => getWindow(e.sender.id)?.hide());
    ipcMain.on(Channels.MINIMIZE_WINDOW, (e) => getWindow(e.sender.id)?.minimize());
    ipcMain.on(Channels.CLOSE_WINDOW, (e) => getWindow(e.sender.id)?.close());
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


interface ControlOptions {
    /**
     * Whether the given window is the main window. Additional listeners are enabled for the main window.
     */
    isMain: boolean;
}

/**
 * Enable window management API for the given window.
 */
function forWindow(w: BrowserWindow, opt?: Partial<ControlOptions>) {
    allowedWindows.add(w);

    // Revoke the listeners once closed
    w.once("closed", () => allowedWindows.delete(w));

    if (opt?.isMain) {
        setupWindowSize(w);
    }
}

/**
 * Changes the size of the window according to the settings and add a listener for memorizing future changes.
 */
function setupWindowSize(w: BrowserWindow) {
    const sz = conf().app.window.size.split(",").map(it => parseInt(it, 10));

    if (sz.length >= 2 && sz.every(it => !isNaN(it))) {
        w.setSize(sz[0], sz[1]);
    }

    const pos = conf().app.window.pos.split(",").map(it => parseInt(it, 10));

    if (pos.length >= 2 && pos.every(it => !isNaN(it))) {
        w.setPosition(pos[0], pos[1]);
    }

    w.on("resized", () => {
        conf().app.window.size = w.getSize().join(",");
    });

    w.on("moved", () => {
        conf().app.window.pos = w.getPosition().join(",");
    });
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

    return [width * scaleFactor, height * scaleFactor];
}

export const bwctl = { setup, forWindow, optimalSize };