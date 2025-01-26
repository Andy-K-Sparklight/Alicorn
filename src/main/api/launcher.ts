import { ipcMain } from "@/main/ipc/typed";
import { bl } from "@/main/launch/bl";
import { reg } from "@/main/registry/registry";
import { MessageChannelMain, MessagePortMain } from "electron";
import type EventEmitter from "node:events";

ipcMain.handle("launch", async (_, launchHintId: string) => {
    const launchHint = reg.launchHints.get(launchHintId);
    if (!launchHint) throw `No such launch hint: ${launchHintId}`;

    console.log(`Launching ${launchHintId}`);
    const g = await bl.launch(launchHint);

    return g.id;
});

ipcMain.on("subscribeGameEvents", (e, gid: string) => {
    const g = bl.getInstance(gid);
    const ch = new MessageChannelMain();
    forwardGameEvents(g.emitter, ch.port1);
    e.sender.postMessage(`feedGameEvents:${gid}`, null, [ch.port2]);
});

ipcMain.on("stopGame", (_, gid: string) => {
    bl.getInstance(gid).stop();
});

ipcMain.on("removeGame", (_, gid: string) => {
    bl.removeInstance(gid);
});

function forwardGameEvents(src: EventEmitter, dst: MessagePortMain) {
    ["end", "crash", "exit", "stdout", "stderr"].forEach(ch => {
        src.on(ch, (...args) => dst.postMessage({ channel: ch, args }));
    });
}
