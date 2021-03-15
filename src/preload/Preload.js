import { contextBridge, ipcRenderer } from "electron";

// This is UNSAFE!!!
// We should always check those arguments.
// We'll deal with that after dealing with the game profiles.
contextBridge.exposeInMainWorld("_alicorn_internal_ipc_renderer", ipcRenderer);
