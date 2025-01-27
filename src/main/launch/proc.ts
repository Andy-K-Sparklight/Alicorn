import { conf } from "@/main/conf/conf";
import { nanoid } from "nanoid";
import * as child_process from "node:child_process";
import { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import { Readable } from "node:stream";
import type TypedEmitter from "typed-emitter";

type GameProcessEvents = {
    /**
     * Exits normally.
     */
    exit: () => void

    /**
     * Exits abnormally.
     */
    crash: () => void

    /**
     * Exits regardless of status.
     */
    end: () => void;

    /**
     * Standard output message received.
     */
    stdout: (s: string) => void

    /**
     * Standard error message received.
     */
    stderr: (s: string) => void
}

type GameProcessStatus = "created" | "running" | "exited" | "crashed"

export class GameProcess {
    id = nanoid();
    emitter = new EventEmitter() as TypedEmitter<GameProcessEvents>;
    status: GameProcessStatus = "created";
    logs = {
        stdout: [] as string[],
        stderr: [] as string[]
    };
    private proc: ChildProcess | null = null;

    constructor(bin: string, args: string[], gameDir: string) {
        const proc = child_process.spawn(bin, args, {
            cwd: gameDir,
            detached: true
        });

        this.proc = proc;

        proc.once("spawn", () => {
            this.status = "running";
        });

        proc.on("error", (e) => {
            console.error(`Error occurred in game instance ${this.id} (PID ${this.proc?.pid ?? "UNKNOWN"})`);
            console.error(e);
        });

        proc.once("exit", (code) => {
            console.log(`Game instance ${this.id} (PID ${this.proc?.pid ?? "UNKNOWN"}) exited with code ${code}.`);
            if (code === 0) {
                this.status = "exited";
                this.emitter.emit("exit");
            } else {
                this.status = "crashed";
                this.emitter.emit("crash");
            }

            this.emitter.emit("end");
        });

        const collect = (s: Readable, t: string[]) => {
            const limit = conf().runtime.logsLimit;
            s.on("readable", () => {
                let data: any;

                while (true) {
                    data = s.read();
                    if (data === null) break;

                    t.push(data.toString());

                    if (t.length > limit) {
                        t.shift();
                    }
                }
            });
        };

        collect(proc.stdout, this.logs.stdout);
        collect(proc.stderr, this.logs.stderr);
    }

    /**
     * Gets the process PID.
     */
    pid() {
        return this.proc?.pid ?? -1;
    }

    /**
     * Terminates the process.
     */
    stop() {
        this.proc?.kill();
        this.detach();
    }

    detach() {
        this.proc?.stdout?.removeAllListeners();
        this.proc?.stderr?.removeAllListeners();
        this.emitter.removeAllListeners();
        this.proc = null;
    }
}

const procs = new Map<string, GameProcess>();

/**
 * Creates a new game process and saves it for lookups.
 */
function create(...args: ConstructorParameters<typeof GameProcess>): GameProcess {
    const g = new GameProcess(...args);
    procs.set(g.id, g);
    g.emitter.once("exit", () => procs.delete(g.id));
    return g;
}

export const gameProc = { create };
