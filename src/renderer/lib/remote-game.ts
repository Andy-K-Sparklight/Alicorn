/**
 * Syncs events from main process and maintain renderer-side game instances.
 */

import type { GameProfileDetail } from "@/main/game/spec";
import type { GameProcessLog } from "@/main/launch/log-parser";
import debounce from "debounce";
import { pEvent } from "p-event";
import { useEffect, useState } from "react";

/**
 * Contains a slice of game information at the renderer side.
 */
export interface RemoteGameProcess {
    id: string;
    pid: number;
    detail: GameProfileDetail;

    status: RemoteGameStatus;

    outputs: {
        stdout: string[];
        stderr: string[];
    };

    logs: GameProcessLog[];
}

export type RemoteGameStatus = "running" | "exited" | "crashed";

/**
 * Update the given process object based on events from the event target.
 */
function syncEvents(emitter: EventTarget, proc: RemoteGameProcess): RemoteGameProcess {
    emitter.addEventListener("exit", () => proc.status = "exited");
    emitter.addEventListener("crash", () => proc.status = "crashed");

    function clearLogs<T>(buf: T[]) {
        const limit = 10000;
        const deleteCount = 100;
        if (buf.length > limit) {
            buf.splice(0, deleteCount);
        }
    }

    function collect<T>(name: string, buf: T[]) {
        emitter.addEventListener(name, (e: Event) => {
            if (e instanceof CustomEvent) {
                const [s] = e.detail;
                buf.push(s);
                clearLogs(buf);
            }
        });
    }

    collect("stdout", proc.outputs.stdout);
    collect("stderr", proc.outputs.stderr);
    collect("log", proc.logs);

    return proc;
}

const procs = new Map<string, RemoteGameProcess>();
const emitters = new Map<string, EventTarget>();

async function create(detail: GameProfileDetail): Promise<string> {
    const meta = await native.launcher.launch(detail.id);

    console.log(`Created game process ${meta.id} (PID ${meta.pid}).`);

    const proc: RemoteGameProcess = {
        id: meta.id,
        pid: meta.pid,
        detail,
        status: "running",
        outputs: {
            stdout: [],
            stderr: []
        },

        logs: []
    };

    console.log("Establishing event stream...");

    void native.launcher.subscribe(meta.id);

    const msg = await pEvent(window, "message", {
        rejectionEvents: [],
        filter(e) {
            return e instanceof MessageEvent && e.data === `dispatchGameEventsRemote:${meta.id}`;
        }
    }) as MessageEvent;

    console.log("Established event stream.");

    const port = msg.ports[0];

    const et = new EventTarget();

    port.onmessage = e => {
        const { channel, args } = e.data;
        et.dispatchEvent(new CustomEvent(channel, { detail: args }));
    };

    syncEvents(et, proc);

    const em = new EventTarget();

    ["exit", "crash", "stdout", "stderr", "log"].forEach(ch => {
        et.addEventListener(ch, () => em.dispatchEvent(new CustomEvent("change")));
    });

    procs.set(meta.id, proc);
    emitters.set(meta.id, em);

    return meta.id;
}

/**
 * Gets an event target which emits 'change' event when the game status changes.
 */
function subscribe(procId: string): EventTarget {
    const e = emitters.get(procId);
    if (e) return e;
    throw `Process not found: ${procId}`;
}

/**
 * Gets a copy of the game status.
 */
function slice(procId: string): RemoteGameProcess {
    const proc = procs.get(procId);
    if (proc) return structuredClone(proc);
    throw `Process not found: ${procId}`;
}

/**
 * Retrieves an auto-updating game process object.
 *
 * This hook internally uses 'useState' and may cause frequent re-renders.
 * Be aware of this when optimizing.
 *
 * Argument 'wait' can be used to control whether to debounce the specified function.
 */
export function useGameProc(procId: string, wait = 0): RemoteGameProcess {
    const [proc, setProc] = useState(slice(procId));

    useEffect(() => {
        setProc(slice(procId));
        const emitter = subscribe(procId);

        function fn() {
            setProc(slice(procId));
        }

        const handler = wait > 0 ? debounce(fn, wait) : fn;
        emitter.addEventListener("change", handler);

        return () => emitter.removeEventListener("change", handler);
    }, [procId]);

    return proc;
}

export const remoteGame = {
    create
};
