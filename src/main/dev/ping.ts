import { Channels } from "@/main/ipc/channels";
import { ipcMain } from "electron";

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