import { ipcMain } from "@/main/ipc/typed";
import { bl } from "@/main/launch/bl";
import { reg } from "@/main/registry/registry";
import { MessageChannelMain, MessagePortMain } from "electron";
import type EventEmitter from "node:events";

export interface LaunchGameResult {
    id: string;
    pid: number;
}

ipcMain.handle("launch", async (_, gameId: string) => {
    const launchHint = reg.games.get(gameId).launchHint;

    console.log(`Launching ${gameId}`);
    const g = await bl.launch(launchHint);

    return {
        id: g.id,
        pid: g.pid()
    };
});

ipcMain.on("subscribeGameEvents", (e, gid: string) => {
    const g = bl.getInstance(gid);
    const ch = new MessageChannelMain();
    forwardGameEvents(g.emitter, ch.port1);
    e.sender.postMessage(`dispatchGameEvents:${gid}`, null, [ch.port2]);
});

ipcMain.on("stopGame", (_, procId: string) => {
    bl.getInstance(procId).stop();
});

ipcMain.on("removeGame", (_, procId: string) => {
    bl.removeInstance(procId);
});

function forwardGameEvents(src: EventEmitter, dst: MessagePortMain) {
    ["end", "crash", "exit", "stdout", "stderr"].forEach(ch => {
        src.on(ch, (...args) => dst.postMessage({ channel: ch, args }));
    });
}
