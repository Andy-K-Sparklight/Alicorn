import { MinecraftContainer } from "../container/MinecraftContainer";
import { ChildProcess, spawn } from "child_process";
import objectHash from "object-hash";
import { Pair } from "../commons/Collections";
import EventEmitter from "events";

export const POOL = new Map<string, RunningMinecraft>();
const END_GATE = "END";
const LOG_GATE = "LOG";

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
      this.status = RunningStatus.STOPPING;
      this.exitCode = String(code || signal);
      this.emitter?.emit(END_GATE);
    });
    this.process.stdout?.on("data", (d) => {
      this.logs.getFirstValue().push(d);
      this.emitter?.emit(LOG_GATE);
    });
    this.process.stderr?.on("data", (d) => {
      this.logs.getSecondValue().push(d);
      this.emitter?.emit(LOG_GATE);
    });
    const id = objectHash([this.executable, this.args, this.process]);
    POOL.set(id, this);
    this.status = RunningStatus.RUNNING;
    return id;
  }

  kill(): void {
    this.process?.kill(0);
  }

  disconnect(): void {
    this.process?.disconnect();
  }

  on(channel: string, fn: () => void): void {
    this.emitter?.on(channel, fn);
  }
}

enum RunningStatus {
  STARTING,
  RUNNING,
  STOPPING,
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

export function whenFinished(
  runID: string,
  fn: (exitCode: string) => void
): void {
  const ins = POOL.get(runID);
  ins?.on(END_GATE, () => {
    fn(String(ins.exitCode));
  });
}

export function onLog(
  runID: string,
  fn: (log: Pair<string[], string[]>) => void
): void {
  const ins = POOL.get(runID);
  ins?.on(LOG_GATE, () => {
    fn(ins.logs);
  });
}
