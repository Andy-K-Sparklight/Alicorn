import { conf } from "@/main/conf/conf";
import { type GameProcessLog, logParser } from "@/main/launch/log-parser";
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

    /**
     * Game log object parsed and received.
     */
    log: (log: GameProcessLog) => void
}

type GameProcessStatus = "created" | "running" | "exited" | "crashed"

export class GameProcess {
    id = nanoid();
    emitter = new EventEmitter() as TypedEmitter<GameProcessEvents>;
    status: GameProcessStatus = "created";
    outputs = {
        stdout: [] as string[],
        stderr: [] as string[]
    };
    logs: GameProcessLog[] = [];
    #proc: ChildProcess | null = null;

    constructor(bin: string, args: string[], gameDir: string) {
        const proc = child_process.spawn(bin, args, {
            cwd: gameDir,
            detached: true
        });

        this.#proc = proc;

        proc.once("spawn", () => {
            this.status = "running";
        });

        proc.on("error", (e) => {
            console.error(`Error occurred in game instance ${this.id} (PID ${this.#proc?.pid ?? "UNKNOWN"})`);
            console.error(e);
        });

        proc.once("exit", (code) => {
            console.log(`Game process ${this.id} (PID ${proc.pid ?? "UNKNOWN"}) exited with code ${code}.`);
            if (code === 0) {
                this.status = "exited";
                this.emitter.emit("exit");
            } else {
                this.status = "crashed";
                this.emitter.emit("crash");
            }

            this.emitter.emit("end");
            this.detach();
        });

        let logIndex = 0;

        const collect = (s: Readable, t: string[], name: "stdout" | "stderr") => {
            const limit = conf().runtime.logsLimit;
            s.on("readable", () => {
                let data: any;

                while (true) {
                    data = s.read();
                    if (data === null) break;

                    const str = data.toString();

                    const logs = logParser.parse(str, logIndex);
                    logIndex += logs.length;

                    for (const l of logs) {
                        this.logs.push(l);
                        this.emitter.emit("log", l);
                    }

                    t.push(str);
                    this.emitter.emit(name, str);

                    if (t.length > limit) {
                        t.shift();
                    }
                }
            });
        };

        collect(proc.stdout, this.outputs.stdout, "stdout");
        collect(proc.stderr, this.outputs.stderr, "stderr");
    }

    /**
     * Gets the process PID.
     */
    pid() {
        return this.#proc?.pid ?? -1;
    }

    /**
     * Terminates the process.
     */
    stop() {
        this.#proc?.kill();
    }

    detach() {
        this.#proc?.stdout?.removeAllListeners();
        this.#proc?.stderr?.removeAllListeners();
        this.emitter.removeAllListeners();
        this.#proc = null;
    }
}


/**
 * Creates a new game process and saves it for lookups.
 */
function create(...args: ConstructorParameters<typeof GameProcess>): GameProcess {
    return new GameProcess(...args);
}

export const gameProc = { create };
