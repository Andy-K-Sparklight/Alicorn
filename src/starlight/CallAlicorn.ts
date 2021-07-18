import { ipcRenderer } from "electron";

let MAIN_WINDOW: number;
let cEvent = 0;

export async function initAlicornInvoke(): Promise<void> {
  MAIN_WINDOW = await ipcRenderer.invoke("getMainWindow");
}

export async function invoke(channel: string, arg?: unknown): Promise<unknown> {
  const eid = ++cEvent;
  ipcRenderer.sendTo(MAIN_WINDOW, channel, eid, arg);
  return new Promise<unknown>((resolve) => {
    ipcRenderer.once(channel + eid, (_e, result) => {
      resolve(result);
    });
  });
}
