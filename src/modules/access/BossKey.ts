// Quickly kill Minecraft and hide Alicorn with just one hot key.

import { ipcRenderer } from "electron";
import { getString } from "../config/ConfigSupport";
import { stopAllMinecraft } from "../launch/MinecraftBootstrap";

export function registerBossKey(): void {
    const k = getString("bosskey");
    if (k.length > 0) {
        ipcRenderer.send("registerHotKey", k);
        ipcRenderer.on("HotKey-" + k, () => {
            stopAllMinecraft();
            ipcRenderer.send("toggleWindow");
        });
    }
}
