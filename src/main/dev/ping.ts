import { ipcMain } from "electron";
import { Channels } from "@/main/ipc/channels.ts";

function setup(): void {
    /**
     * Receives and logs ping messages.
     */
    ipcMain.handle(Channels.PING, (_, serial: number) => {
        console.log("Renderer ping received.");
        return serial + 1;
    });
}

export const ping = { setup };