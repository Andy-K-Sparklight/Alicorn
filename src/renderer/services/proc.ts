/**
 * Syncs events from main process and maintain renderer-side game instances.
 */

import type { GameProcEvent } from "@/main/api/launcher";
import type { GameProfile } from "@/main/game/spec";
import type { GameProcessLog } from "@/main/launch/log-parser";
import { retrievePort } from "@/preload/message";
import Emittery from "emittery";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Contains a slice of game information at the renderer side.
 */
export interface RemoteGameProcess {
    id: string;
    pid: number;
    status: RemoteGameStatus;
    profile: GameProfile;
    memUsage: number[];
    startTime: number;
    exitTime?: number;

    outputs: {
        stdout: string[];
        stderr: string[];
    };

    logs: GameProcessLog[];
}

export type RemoteGameStatus = "running" | "exited" | "crashed";

function clearLogs<T>(buf: T[]) {
    const limit = 10000;
    const deleteCount = 100;
    if (buf.length > limit) {
        buf.splice(0, deleteCount);
    }
}

const procs = new Map<string, RemoteGameProcess>();
let procsArray: RemoteGameProcess[] = [];

// Emits "change" event on changing of any component
const detailedEmitter = new Emittery();

// Emits "change" event only when game statuses change
const restrictedEmitter = new Emittery();

// Sync the immutable processes array when the map changes
restrictedEmitter.on("change", () => {
    procsArray = [...procs.values()];
});

async function create(id: string): Promise<string> {
    const meta = await native.launcher.launch(id);
    const profile = await native.game.getProfile(id);

    console.log(`Created game process ${meta.id} (PID ${meta.pid}).`);

    const proc: RemoteGameProcess = {
        id: meta.id,
        pid: meta.pid,
        profile,
        memUsage: [],
        status: "running",
        startTime: Date.now(), // Time measurement is done at the front end
        outputs: {
            stdout: [],
            stderr: []
        },

        logs: []
    };

    console.log("Establishing event stream...");

    native.launcher.subscribe(meta.id);

    const port = await retrievePort(meta.id);

    console.log("Established event stream.");

    port.onmessage = (e: MessageEvent<GameProcEvent>) => {
        const currentProc = procs.get(meta.id);
        if (!currentProc) return;

        const np = structuredClone(currentProc); // Process objects should be immutable
        switch (e.data.type) {
            case "exit":
                np.status = "exited";
                np.exitTime = Date.now();
                restrictedEmitter.emit("change");
                break;
            case "crash":
                np.status = "crashed";
                np.exitTime = Date.now();
                restrictedEmitter.emit("change");
                break;
            case "stdout":
            case "stderr":
                const s = e.data.data;
                const buf = np.outputs[e.data.type]; // The channels and the buffers share the same names
                buf.push(s);
                clearLogs(buf);
                break;
            case "log":
                const log = e.data.log;
                np.logs.push(log);
                clearLogs(np.logs);
                break;
            case "memUsageUpdate":
                np.memUsage.push(e.data.mem);
                if (np.memUsage.length > 30) {
                    np.memUsage.splice(0, 10);
                }
                break;
        }

        procs.set(meta.id, np);
        detailedEmitter.emit(`change:${meta.id}`);
    };

    procs.set(meta.id, proc);

    // Emit change event since proc list changes
    void restrictedEmitter.emit("change");

    return meta.id;
}

/**
 * Subscribes to the game process detail.
 *
 * This hook updates its value whenever a component (status, logs, outputs) of the process changes.
 * This can introduce much performance overhead and should be taken into account when using.
 */
export function useGameProcDetail(procId: string): RemoteGameProcess {
    const subscribe = useCallback((cb: () => void) => {
        const ch = `change:${procId}`;
        detailedEmitter.on(ch, cb);
        return () => restrictedEmitter.off(ch, cb);
    }, [procId]);

    const getSnapshot = useCallback(() => procs.get(procId)!, [procId]);

    return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Subscribes to the game process list.
 *
 * This hook only updates its value when the game status changes.
 * Logs and outputs do not trigger updates for performance concerns.
 */
export function useGameProcList(): RemoteGameProcess[] {
    const subscribe = useCallback((cb: () => void) => {
        restrictedEmitter.on("change", cb);
        return () => restrictedEmitter.off("change", cb);
    }, []);

    const getSnapshot = useCallback(() => procsArray, []);

    return useSyncExternalStore(subscribe, getSnapshot);
}

export const procService = {
    create
};
