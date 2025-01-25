import type { UserConfig } from "@/main/conf/conf";
import { type IpcCommands, type IpcEvents } from "@/main/ipc/channels";
import type { TypedIpcRenderer } from "@/main/ipc/typed";
import { contextBridge, ipcRenderer as ipcRendererRaw } from "electron";

console.log("Enabling preload script.");

const ipcRenderer = ipcRendererRaw as TypedIpcRenderer<IpcEvents, IpcCommands>;

const native = {
    /**
     * Window control methods.
     */
    bwctl: {
        /**
         * Makes the window visible.
         */
        show(): void {
            ipcRenderer.send("showWindow");
        },

        /**
         * Makes the window no longer visible.
         */
        hide(): void {
            ipcRenderer.send("hideWindow");
        },

        /**
         * Closes the window.
         */
        close(): void {
            ipcRenderer.send("closeWindow");
        },

        /**
         * Minimizes the window.
         */
        minimize(): void {
            ipcRenderer.send("minimizeWindow");
        }
    },

    /**
     * Configuration sync methods.
     */
    conf: {
        get(): Promise<UserConfig> {
            return ipcRenderer.invoke("getConfig");
        },

        update(conf: UserConfig): void {
            ipcRenderer.send("updateConfig", conf);
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
            ipcRenderer.send("openUrl", url);
        },

        /**
         * Selects a directory.
         */
        selectDir(): Promise<string> {
            return ipcRenderer.invoke("selectDir");
        }
    }
};

contextBridge.exposeInMainWorld("native", native);

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;
