import { echo } from "./BaseCommands";
import { jconf } from "../java/JConfigure";

const ALL_HANDLERS: Map<
  string,
  (wholeCommand: string, log: (msg: string) => void) => Promise<void>
> = new Map<
  string,
  (wholeCommand: string, log: (msg: string) => unknown) => Promise<void>
>();

export function registerCommandHandler(
  cmdName: string,
  fn: (wholeCommand: string, log: (msg: string) => void) => Promise<void>
): void {
  if (ALL_HANDLERS.has(cmdName)) {
    throw new Error("Registering to an existed command: " + cmdName);
  } else {
    ALL_HANDLERS.set(cmdName, fn);
  }
}

export async function handleCommand(
  cmd: string,
  log: (msg: string) => void
): Promise<boolean> {
  const c = cmd.split(" ");
  const cName = c[0];
  if (cName === undefined) {
    return false;
  }
  const fn = ALL_HANDLERS.get(cName.toLowerCase());
  if (fn) {
    await fn(cmd, log);
    return true;
  }
  return false;
}

export function initBuiltInCommands(): void {
  registerCommandHandler("echo", echo);
  registerCommandHandler("jconf", jconf);
}
