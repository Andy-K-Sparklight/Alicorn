import { contextBridge, ipcRenderer } from "electron";
import { Channels } from "@/main/ipc/channels";

console.log("Enabling preload script.");

const native = {
    /**
     * Development APIs.
     */
    dev: {
        /**
         * Sends a ping message to main process.
         */
        ping(serial: number): Promise<number> {
            return ipcRenderer.invoke(Channels.PING, serial);
        }
    },

    /**
     * Window control methods.
     */
    bwctl: {
        /**
         * Makes the window visible.
         */
        show(): void {
            ipcRenderer.send(Channels.SHOW_WINDOW);
        },

        /**
         * Makes the window no longer visible.
         */
        hide(): void {
            ipcRenderer.send(Channels.HIDE_WINDOW);
        },

        /**
         * Closes the window.
         */
        close(): void {
            ipcRenderer.send(Channels.CLOSE_WINDOW);
        },

        /**
         * Minimizes the window.
         */
        minimize(): void {
            ipcRenderer.send(Channels.MINIMIZE_WINDOW);
        }
    },

    /**
     * Misc operations.
     */
    ext: {
        /**
         * Opens a URL in external browser.
         */
        openURL(url: string): void {
            ipcRenderer.send(Channels.OPEN_URL, url);
        }
    }
};

contextBridge.exposeInMainWorld("native", native);

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;