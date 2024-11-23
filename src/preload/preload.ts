import { ipcRenderer } from "electron";
import { Channels } from "@/main/ipc/channels.ts";

console.log("Enabling preload script.");

const native = {
    /**
     * Sends a ping message to main process.
     */
    ping(serial: number): Promise<number> {
        return ipcRenderer.invoke(Channels.PING, serial);
    },

    /**
     * Window control methods.
     */
    bwctl: {
        /**
         * Make the window visible.
         */
        show(): void {
            ipcRenderer.send(Channels.SHOW_WINDOW);
        },

        /**
         * Make the window no longer visible.
         */
        hide(): void {
            ipcRenderer.send(Channels.HIDE_WINDOW);
        },

        /**
         * Close the window.
         */
        close(): void {
            ipcRenderer.send(Channels.CLOSE_WINDOW);
        },

        /**
         * Gets notified when a user close request is forwarded from the main process.
         * @param handler Event handler.
         *
         * @deprecated This is a workaround. The method will be removed once the frontend no longer contains losable changes.
         */
        onCloseRequest(handler: () => void): void {
            ipcRenderer.once(Channels.REQUEST_CLOSE, () => {
                handler();
            });
        }
    }
};

// TODO: enable context isolation after migrated to backend invocation
// contextBridge.exposeInMainWorld("native", native);

// A temporary workaround to avoid breaking existing frontend native code
// @ts-ignore
window.native = native;

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;