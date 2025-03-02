import { ALXClient } from "@/main/alx/ALXClient";
import { conf } from "@/main/conf/conf";
import { type GameProcessLog, logParser } from "@/main/launch/log-parser";
import { exceptions } from "@/main/util/exception";
import { nanoid } from "nanoid";
import * as child_process from "node:child_process";
import EventEmitter from "node:events";
import os from "node:os";
import * as process from "node:process";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import { pEvent } from "p-event";
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
     * Memory usage value updated.
     */
    memUsageUpdate: (bytes: number) => void;

    /**
     * ALX server attached.
     */
    alxAttached: () => void;
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

    /**
     * Processes started with Alicorn AltLauncher will have a query port.
     * This value will be assigned once the port is sent over stdout.
     */
    alxPort: number | null = null;
    alxNonce: string;
    alxClient: ALXClient | null = null;

    #readyPromise: Promise<void> | null = null;
    #proc: child_process.ChildProcess | null = null;
    #memMonitTimer: NodeJS.Timer | null = null;
    #netMonitTimer: NodeJS.Timer | null = null;

    constructor(bin: string, args: string[], gameDir: string, alxNonce: string) {
        const env = { ...process.env };

        delete env.APPDATA; // Prevent legacy versions from reading

        const proc = child_process.spawn(bin, args, {
            cwd: gameDir,
            detached: true,
            env,
            stdio: ["ignore", "overlapped", "overlapped"]
        });

        this.#proc = proc;

        this.#readyPromise = pEvent(proc, "spawn");

        this.alxNonce = alxNonce;

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

        // Prevent the child process from blocking the app to exit
        proc.unref();

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
                        this.#handleLogExtensions(l.message.trim());
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
        this.alxClient?.close();

        if (this.#memMonitTimer) {
            clearInterval(this.#memMonitTimer);
        }

        if (this.#netMonitTimer) {
            clearInterval(this.#netMonitTimer);
        }

        if (this.#proc) {
            this.#proc.stdout?.removeAllListeners();
            this.#proc.stderr?.removeAllListeners();
            this.#proc.stdout?.destroy();
            this.#proc.stderr?.destroy();
        }

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

        // Gets memory usage from ALX server if available
        if (this.alxClient) {
            return await this.alxClient.getMemoryUsage();
        }

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
        if (s.startsWith("ALX-Server-Port: ") && !this.alxPort) {
            this.alxPort = parseInt(s.slice("ALX-Server-Port: ".length), 10);
            this.alxClient = new ALXClient(`ws://localhost:${this.alxPort}`, this.alxNonce);
            console.log("Attached ALX server at port " + this.alxPort);
            this.emitter.emit("alxAttached");
        }
    }

    static async create(...args: ConstructorParameters<typeof GameProcess>): Promise<GameProcess> {
        const proc = new GameProcess(...args);
        try {
            await proc.#readyPromise;
        } catch (e) {
            throw exceptions.create("launch-spawn", { error: String(e) });
        }
        return proc;
    }
}
