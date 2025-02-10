import { conf } from "@/main/conf/conf";
import { type GameProcessLog, logParser } from "@/main/launch/log-parser";
import isValidHostname from "is-valid-hostname";
import { nanoid } from "nanoid";
import * as child_process from "node:child_process";
import { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import os from "node:os";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import ping from "ping";
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

    /**
     * New ping value received from network monitor.
     */
    serverPingUpdate: (ping: number) => void;

    /**
     * Memory usage value updated.
     */
    memUsageUpdate: (bytes: number) => void;

    /**
     * Server changes.
     */
    serverChange: (server: string | null) => void;
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
    #memMonitTimer: NodeJS.Timer | null = null;
    #netMonitTimer: NodeJS.Timer | null = null;
    #currentServer: string | null = null;

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
                        this.#handleLogExtensions(l.message);
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

        this.#memMonitTimer = setInterval(async () => {
            try {
                const m = await this.getMemoryUsage();
                this.emitter.emit("memUsageUpdate", m);
            } catch {
            }
        }, 1000);

        this.#netMonitTimer = setInterval(async () => {
            if (this.#currentServer) {
                const res = await ping.promise.probe(this.#currentServer, { timeout: 1 });
                this.emitter.emit("serverPingUpdate", typeof res.time === "number" ? res.time : 0);
            }
        }, 1000);
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
        if (this.#memMonitTimer) {
            clearInterval(this.#memMonitTimer);
        }

        if (this.#netMonitTimer) {
            clearInterval(this.#netMonitTimer);
        }

        this.#proc?.stdout?.removeAllListeners();
        this.#proc?.stderr?.removeAllListeners();
        this.emitter.removeAllListeners();
        this.#proc = null;
    }

    /**
     * Queries the estimated memory usage of the game.
     *
     * There is not a single authoritative source of how much RAM a process really uses.
     * We take working set on Windows and RSS on Linux-like systems for what's commonly known as "memory usage".
     */
    async getMemoryUsage(): Promise<number> {
        if (!this.#proc) return -1;

        let cmdLine: string;
        let factor = 1;

        if (os.platform() === "win32") {
            cmdLine = `wmic process where processid=${this.#proc.pid} get WorkingSetSize`;
        } else {
            cmdLine = `ps -o rss= ${this.#proc.pid}`;
            factor = 1024;
        }

        const exec = promisify(child_process.exec);

        const { stdout } = await exec(cmdLine);
        return parseInt(stdout.toString().match(/[1-9][0-9]*/)?.[0] ?? "0", 10) * factor || 0;
    }

    #handleLogExtensions(s: string) {
        if (s.includes("[CHAT]")) return; // Prevent chat message injection

        const ss = s.toLowerCase();

        if (ss.startsWith("connecting to")) {
            const [rawHost] = ss.replaceAll("connecting to", "").split(",");
            const host = rawHost.trim();
            if (isValidHostname(host)) {
                this.#currentServer = host;
                this.emitter.emit("serverChange", host);
            }
        }

        if (ss.startsWith("starting integrated minecraft server")) {
            // User went single-player, remove server information
            this.#currentServer = null;
            this.emitter.emit("serverChange", null);
        }
    }
}


/**
 * Creates a new game process and saves it for lookups.
 */
function create(...args: ConstructorParameters<typeof GameProcess>): GameProcess {
    return new GameProcess(...args);
}

export const gameProc = { create };
