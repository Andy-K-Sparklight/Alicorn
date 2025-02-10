import { ipcMain } from "@/main/ipc/typed";
import { bl } from "@/main/launch/bl";
import type { GameProcessLog } from "@/main/launch/log-parser";
import { reg } from "@/main/registry/registry";
import { MessagePortMain } from "electron";
import type EventEmitter from "node:events";

export interface LaunchGameResult {
    id: string;
    pid: number;
}

ipcMain.handle("launch", async (_, gameId: string) => {
    const launchHint = reg.games.get(gameId).launchHint;

    const g = await bl.launch(launchHint);

    return {
        id: g.id,
        pid: g.pid()
    };
});

ipcMain.on("subscribeGameEvents", (e, gid: string) => {
    const g = bl.getInstance(gid);
    const [port] = e.ports;
    forwardGameEvents(g.emitter, port);

    g.emitter.once("end", () => port.close());
});

ipcMain.on("stopGame", (_, procId: string) => {
    bl.getInstance(procId).stop();
});

ipcMain.on("removeGame", (_, procId: string) => {
    bl.removeInstance(procId);
});

export type GameProcEvent =
    {
        type: "end" | "crash" | "exit";
    } |
    {
        type: "stdout" | "stderr";
        data: string;
    } |
    {
        type: "log";
        log: GameProcessLog
    } |
    {
        type: "memUsageUpdate",
        mem: number
    } |
    {
        type: "serverChange",
        server: string | null
    } |
    {
        type: "serverPingUpdate",
        ping: number
    }

function forwardGameEvents(src: EventEmitter, dst: MessagePortMain) {
    function send(data: GameProcEvent) {
        dst.postMessage(data);
    }

    src.on("end", () => send({ type: "end" }));
    src.on("crash", () => send({ type: "crash" }));
    src.on("exit", () => send({ type: "exit" }));
    src.on("stdout", data => send({ type: "stdout", data }));
    src.on("stderr", data => send({ type: "stderr", data }));
    src.on("log", log => send({ type: "log", log }));
    src.on("memUsageUpdate", mem => send({ type: "memUsageUpdate", mem }));
    src.on("serverChange", server => send({ type: "serverChange", server }));
    src.on("serverPingUpdate", ping => send({ type: "serverPingUpdate", ping }));
}
