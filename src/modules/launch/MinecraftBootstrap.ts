import { ChildProcess, exec, spawn } from "child_process";
import EventEmitter from "events";
import os from "os";
import { PROCESS_END_GATE, PROCESS_LOG_GATE } from "../commons/Constants";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { restoreMods } from "../modx/ModDynLoad";

const POOL = new Map<string, RunningMinecraft>();
const REV_POOL = new Map<RunningMinecraft, string>();

export function getRunningInstanceCount(): number {
  return POOL.size;
}

class RunningMinecraft {
  readonly args: string[];
  readonly executable: string;
  readonly container: MinecraftContainer;
  readonly isolateRoot: string;
  status: RunningStatus = RunningStatus.STARTING;
  emitter: EventEmitter | null = null;
  exitCode = "";
  private process: ChildProcess | null = null;
  // logs: Pair<string[], string[]> = new Pair<string[], string[]>([], []);

  constructor(
    args: string[],
    exec: string,
    container: MinecraftContainer,
    isolateRoot: string,
    emitter: EventEmitter | null = null
  ) {
    this.args = args;
    this.container = container;
    this.executable = exec;
    this.emitter = emitter;
    this.isolateRoot = isolateRoot;
  }
  run(): string {
    try {
      this.process = spawn(this.executable, this.args, {
        cwd: this.isolateRoot || this.container.rootDir,
        detached: true, // Won't close after launcher closed
      });
    } catch (e) {
      console.log(e);
    }
    this.process?.on("exit", (code, signal) => {
      this.status = RunningStatus.STOPPING;
      if (code === undefined || code === null) {
        this.exitCode = String(signal);
      }
      this.exitCode = String(code);
      this.emitter?.emit(PROCESS_END_GATE, this.exitCode);
      const id = REV_POOL.get(this);
      if (id !== undefined) {
        POOL.delete(id);
      }
      REV_POOL.delete(this);
    });

    this.process?.stdout?.on("data", (d) => {
      const strD = d.toString();
      // this.logs.getFirstValue().push(strD);
      this.emitter?.emit(PROCESS_LOG_GATE, strD, false);
    });
    this.process?.stderr?.on("data", (d) => {
      const strD = d.toString();
      // this.logs.getSecondValue().push(strD);
      this.emitter?.emit(PROCESS_LOG_GATE, strD, true);
    });
    const id = (
      this.process?.pid || Math.floor(Math.random() * 10000)
    ).toString();
    POOL.set(id, this);
    REV_POOL.set(this, id);
    this.status = RunningStatus.RUNNING;
    return id;
  }

  kill(): void {
    this.status = RunningStatus.STOPPING;
    const pid = this.process?.pid;
    if (pid) {
      if (os.platform() === "win32") {
        exec(`taskkill /pid ${pid} /t /f`);
      } else {
        exec("kill -KILL " + pid);
      }
    }
  }

  disconnect(): void {
    this.status = RunningStatus.UNKNOWN;
    this.process?.disconnect();
  }

  onEnd(fn: (exitCode: string) => unknown): void {
    this.emitter?.on(PROCESS_END_GATE, (c) => {
      fn(c);
    });
  }

  onLog(fnLog: (s: string) => unknown, fnErr: (s: string) => unknown): void {
    this.emitter?.on(PROCESS_LOG_GATE, (s, isErr) => {
      if (isErr) {
        fnErr(s);
      } else {
        fnLog(s);
      }
    });
  }
}

enum RunningStatus {
  STARTING,
  RUNNING,
  STOPPING,
  UNKNOWN,
}

export function runMinecraft(
  args: string[],
  javaExecutable: string,
  container: MinecraftContainer,
  isolateRoot: string,
  emitter?: EventEmitter
): string {
  const runningArtifact = new RunningMinecraft(
    args,
    javaExecutable,
    container,
    isolateRoot,
    emitter
  );
  runningArtifact.onEnd(() => {
    void restoreMods(container);
  });
  return runningArtifact.run();
}

export function stopMinecraft(runID: string): void {
  POOL.get(runID)?.kill();
}
