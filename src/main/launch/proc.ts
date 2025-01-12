import { conf } from "@/main/conf/conf";
import { ChildProcess } from "child_process";
import EventEmitter from "events";
import { nanoid } from "nanoid";
import * as child_process from "node:child_process";
import { Readable } from "node:stream";
import TypedEmitter from "typed-emitter";

type GameInstanceEvents = {
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

enum GameInstanceStatus {
    CREATED = "created",
    RUNNING = "running",
    EXITED = "exited",
    CRASHED = "crashed"
}

export class GameInstance {
    id = nanoid();
    emitter = new EventEmitter() as TypedEmitter<GameInstanceEvents>;
    status = GameInstanceStatus.CREATED;
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
            this.status = GameInstanceStatus.RUNNING;
        });

        proc.on("error", (e) => {
            console.error(`Error occurred in game instance ${this.id} (PID ${this.proc?.pid ?? "UNKNOWN"})`);
            console.error(e);
        });

        proc.once("exit", (code) => {
            console.log(`Game instance ${this.id} (PID ${this.proc?.pid ?? "UNKNOWN"}) exited with code ${code}.`);
            if (code === 0) {
                this.emitter.emit("exit");
                this.status = GameInstanceStatus.EXITED;
            } else {
                this.emitter.emit("crash");
                this.status = GameInstanceStatus.CRASHED;
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
     * Terminates the process.
     */
    stop() {
        this.proc?.kill();
    }
}

const instances = new Map<string, GameInstance>();

/**
 * Creates a new game process and saves it for lookups.
 */
function newGameProc(...args: ConstructorParameters<typeof GameInstance>): GameInstance {
    const g = new GameInstance(...args);
    instances.set(g.id, g);
    g.emitter.once("exit", () => instances.delete(g.id));
    return g;
}

export const proc = {
    newGameProc
};