import { submitWarn } from "../../renderer/Renderer";
import { registerAlicornFunctions } from "./AlicornFunctions";
import { initBase } from "./Base";

export function initCommandListener(): void {
  window.addEventListener("AlicornCommand", (e) => {
    dispatchCommand(
      String((e as CustomEvent).detail)
        .trim()
        .slice(1)
    );
  });
  initBase();
  registerAlicornFunctions();
}

export type CommandHandler = (args: string[]) => Promise<unknown | void>;
const CDT: Map<string, CommandHandler> = new Map();

export async function dispatchCommand(cmd: string): Promise<unknown> {
  const sa = cmd.trim().split(/\s+/);
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
    } catch {
      return undefined;
    }
  } else {
    submitWarn("Unknown command!");
  }
}

export function registerCommand(cmd: string, handler: CommandHandler): void {
  CDT.set(cmd, handler);
}
