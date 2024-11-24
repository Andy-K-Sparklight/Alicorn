/**
 * Window management module.
 */

import { type BrowserWindow, ipcMain } from "electron";
import { Channels } from "@/main/ipc/channels";

const allowedWindows = new Set<BrowserWindow>();

const allowClose = new Set<BrowserWindow>();

/**
 * Setup listeners.
 */
function setup() {
    ipcMain.on(Channels.SHOW_WINDOW, (e) => getWindow(e.sender.id)?.show());
    ipcMain.on(Channels.HIDE_WINDOW, (e) => getWindow(e.sender.id)?.hide());
    ipcMain.on(Channels.CLOSE_WINDOW, (e) => {
        const w = getWindow(e.sender.id);
        if (w) {
            allowClose.add(w);
            w.close();
        }
    });
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
     * Forwards close event triggered by the user to the frontend (the event is prevented) and allow frontend to
     * delay the close event.
     *
     * @deprecated This is a workaround. Remove this once the renderer no longer saves data by itself.
     */
    forwardCloseEvent: boolean;
}

/**
 * Enable window management API for the given window.
 */
function forWindow(w: BrowserWindow, opt?: Partial<ControlOptions>) {
    allowedWindows.add(w);

    // Revoke the listeners once closed
    w.once("closed", () => allowedWindows.delete(w));

    if (opt?.forwardCloseEvent) {
        w.on("close", (e) => {
            if (!allowClose.has(w)) {
                e.preventDefault();
                w.webContents.send(Channels.REQUEST_CLOSE);
            } else {
                allowClose.delete(w);
            }
        });
    }
}

export const bwctl = { setup, forWindow };