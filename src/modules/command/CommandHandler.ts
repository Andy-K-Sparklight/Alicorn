import { echo } from "./BaseCommands";
import { jconf } from "../java/JConfigure";
import { update } from "../../main/UpdateConfigure";
import { locale } from "../../renderer/LocaleConfigure";

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

export function initCommands(): void {
  registerCommandHandler("echo", echo);
  registerCommandHandler("jconf", jconf);
  registerCommandHandler("update", update);
  registerCommandHandler("locale", locale);
}

export function generateAction(
  cmd: string,
  w: string
): { valid: boolean; action: string; arg: string } {
  const regexp = `${cmd}( )*`;
  const args = w.replace(new RegExp(regexp, "i"), "").split(" ");
  let action = args.shift();
  if (action === undefined || action.trim().length === 0) {
    return { valid: false, action: "", arg: "" };
  }
  action = action.trim();
  const pt = args.join(" ");
  return { valid: true, action: action, arg: pt };
}
