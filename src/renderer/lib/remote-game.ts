/**
 * Syncs events from main process and maintain renderer-side game instances.
 */

/**
 * Contains a slice of game information at the renderer side.
 */
interface RemoteGameProcess {
    id: string;
    pid: number;

    status: RemoteGameStatus;

    logs: {
        stdout: string[];
        stderr: string[];
    };
}

type RemoteGameStatus = "running" | "exited" | "crashed";

/**
 * Update the given process object based on events from the event target.
 */
function syncEvents(emitter: EventTarget, proc: RemoteGameProcess): RemoteGameProcess {
    emitter.addEventListener("exit", () => proc.status = "exited");
    emitter.addEventListener("crash", () => proc.status = "crashed");

    function clearLogs(buf: string[]) {
        const limit = 10000;
        const deleteCount = 100;
        if (buf.length > limit) {
            buf.splice(0, deleteCount);
        }
    }

    function collect(name: string, buf: string[]) {
        emitter.addEventListener(name, (e: Event) => {
            if (e instanceof CustomEvent) {
                const [s] = e.detail;
                buf.push(s);
                clearLogs(buf);
            }
        });
    }

    collect("stdout", proc.logs.stdout);
    collect("stderr", proc.logs.stderr);

    return proc;
}

const procs = new Map<string, RemoteGameProcess>();
const emitters = new Map<string, EventTarget>();

async function create(gameId: string): Promise<void> {
    const res = await native.launcher.launch(gameId);
    const proc: RemoteGameProcess = {
        id: res.id,
        pid: res.pid,
        status: "running",
        logs: {
            stdout: [],
            stderr: []
        }
    };

    const et = await native.launcher.subscribe(res.id);
    syncEvents(et, proc);

    const em = new EventTarget();

    ["exit", "crash", "stdout", "stderr"].forEach(ch => {
        et.addEventListener(ch, () => em.dispatchEvent(new CustomEvent("change")));
    });

    procs.set(res.id, proc);
    emitters.set(res.id, em);
}

/**
 * Gets a getter to the game process object and an event target for retrieving the realtime game status.
 */
function subscribe(procId: string): [() => RemoteGameProcess, EventTarget] | null {
    const proc = procs.get(procId);
    const et = emitters.get(procId);

    if (proc && et) {
        return [() => structuredClone(proc), et];
    }

    return null;
}

export const remoteGame = {
    create, subscribe
};
