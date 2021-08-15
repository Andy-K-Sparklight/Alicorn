import { submitWarn } from "../../renderer/Message";
import { getBoolean } from "../config/ConfigSupport";
import { registerAlicornFunctions } from "./AlicornFunctions";
import { initBase } from "./Base";
import { initExtraTools } from "./ExtraTools";
const HISTORY: string[] = [];
export function initCommandListener(): void {
  window.addEventListener("AlicornCommand", (e) => {
    if (getBoolean("command")) {
      dispatchCommand(
        String((e as CustomEvent).detail)
          .trim()
          .slice(1)
      );
    }
  });
  initBase();
  registerAlicornFunctions();
  initExtraTools();
}

export type CommandHandler = (args: string[]) => Promise<unknown | void>;
const CDT: Map<string, CommandHandler> = new Map();

export async function dispatchCommand(cmd: string): Promise<unknown> {
  const sa = cmd.trim().split(/\s+/);
  if (sa[0] === "!!") {
    const c = HISTORY[0];
    if (c) {
      return await dispatchCommand(c);
    }
  } else {
    HISTORY.unshift(cmd);
  }
  const f = CDT.get(sa.shift()?.toLowerCase() || "");
  const arg: string[] = [];
  while (sa.length > 0) {
    let c = sa.shift();
    if (!c) {
      continue;
    }
    if (!c?.startsWith('"')) {
      arg.push(c);
      continue;
    }
    let r: string;
    while (!(r = sa.shift() || '"')?.endsWith('"')) {
      c += " ";
      c += r;
    }
    c += " ";
    c += r;
    arg.push(c.slice(1).slice(0, -1));
  }

  if (f) {
    try {
      return await f(arg);
    } catch (e) {
      submitWarn("Uncaught error happened! " + e);
      return undefined;
    }
  } else {
    submitWarn("Unknown command!");
  }
}

export function registerCommand(cmd: string, handler: CommandHandler): void {
  CDT.set(cmd, handler);
}
