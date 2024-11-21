import { ipcRenderer } from "electron";

console.log("Enabling preload script.");

const native = {
    sys: {
        /**
         * Sends a ping message to main process.
         */
        ping: () => ipcRenderer.send("ping")
    }
};

// TODO: enable context isolation after migrated to backend invocation
// contextBridge.exposeInMainWorld("native", native);

// A temporary workaround to avoid breaking existing frontend native code
// @ts-ignore
window.native = native;

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;