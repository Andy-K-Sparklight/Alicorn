import { Executor } from "./Component";
import { getWindow } from "./GetWindow";
import { invoke } from "./Messenger";

export async function invokeAlicorn(
  channel: string,
  ...args: unknown[]
): Promise<unknown> {
  return await invoke(channel, ...args);
}

export class AlicornCaller extends Executor {
  execute(_document: Document, ..._args: unknown[]): void {
    // @ts-ignore
    getWindow()["invokeAlicorn"] = invokeAlicorn;
  }
}
