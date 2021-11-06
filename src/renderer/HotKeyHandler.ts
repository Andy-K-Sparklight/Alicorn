import { ipcRenderer } from "electron";
import { getBoolean } from "../modules/config/ConfigSupport";

export function setupHotKey(keyBound: string, callback: () => unknown): void {
  ipcRenderer.send("registerHotKey", keyBound);
  ipcRenderer.on(keyBound, () => {
    if (getBoolean("hot-key")) {
      callback();
    }
  });
}
