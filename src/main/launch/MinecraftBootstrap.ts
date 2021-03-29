import { MinecraftContainer } from "../container/MinecraftContainer";
import { ChildProcess, spawn } from "child_process";
import objectHash from "object-hash";
import { Pair } from "../commons/Collections";
import EventEmitter from "events";
import { PROCESS_END_GATE, PROCESS_LOG_GATE } from "../commons/Constants";

const POOL = new Map<string, RunningMinecraft>();

export class RunningMinecraft {
  readonly args: string[];
  readonly executable: string;
  readonly container: MinecraftContainer;
  status: RunningStatus = RunningStatus.STARTING;
  emitter: EventEmitter | null = null;
  exitCode = "";
  private process: ChildProcess | null = null;
  logs: Pair<string[], string[]> = new Pair<string[], string[]>([], []);

  constructor(
    args: string[],
    exec: string,
    container: MinecraftContainer,
    emitter: EventEmitter | null = null
  ) {
    this.args = args;
    this.container = container;
    this.executable = exec;
    this.emitter = emitter;
  }

  run(): string {
    this.process = spawn(this.executable, this.args, {
      cwd: this.container.resolvePath("/"),
    });
    this.process.on("exit", (code, signal) => {
      console.log("Exit code: " + code);
      console.log("Exit signal: " + signal);
      this.status = RunningStatus.STOPPING;
      if (code === undefined || code === null) {
        this.exitCode = String(signal);
      }
      this.exitCode = String(code);
      this.emitter?.emit(PROCESS_END_GATE, this.exitCode);
    });
    this.process.stdout?.on("data", (d) => {
      const strD = d.toString();
      this.logs.getFirstValue().push(strD);
      this.emitter?.emit(PROCESS_LOG_GATE, strD, false);
    });
    this.process.stderr?.on("data", (d) => {
      const strD = d.toString();
      this.logs.getSecondValue().push(strD);
      this.emitter?.emit(PROCESS_LOG_GATE, strD, true);
    });
    const id = objectHash([this.executable, this.args, this.process]);
    POOL.set(id, this);
    this.status = RunningStatus.RUNNING;
    return id;
  }

  kill(): void {
    this.status = RunningStatus.STOPPING;
    this.process?.kill(0);
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
  emitter?: EventEmitter
): string {
  const runningArtifact = new RunningMinecraft(
    args,
    javaExecutable,
    container,
    emitter
  );
  return runningArtifact.run();
}

export function stopMinecraft(runID: string): void {
  POOL.get(runID)?.kill();
}

export function disconnectMinecraft(runID: string): void {
  POOL.get(runID)?.disconnect();
}

export function onEnd(runID: string, fn: (exitCode: string) => void): void {
  const ins = POOL.get(runID);
  ins?.onEnd((c) => {
    fn(String(c));
  });
}

export function onInfo(runID: string, fn: (data: string) => void): void {
  const ins = POOL.get(runID);
  ins?.onLog(
    (s) => {
      fn(s);
    },
    () => {
      return;
    }
  );
}

export function onError(runID: string, fn: (data: string) => void): void {
  const ins = POOL.get(runID);
  ins?.onLog(
    () => {
      return;
    },
    (s) => {
      fn(s);
    }
  );
}

export function getLogPair(id: string): Pair<string[], string[]> {
  return POOL.get(id)?.logs || new Pair<string[], string[]>([], []);
}

export function getExitCode(id: string): string {
  return POOL.get(id)?.exitCode || "";
}

export function getStatus(id: string): RunningStatus {
  return POOL.get(id)?.status || RunningStatus.UNKNOWN;
}
