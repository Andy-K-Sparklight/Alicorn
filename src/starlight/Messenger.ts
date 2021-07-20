import { IpcRenderer } from "electron";
let WEBSOCKET_CLIENT: WebSocket | null = null;
const TSS: Map<number, (v: unknown) => unknown> = new Map();
let cEvent = 0;

export async function initMessenger(): Promise<void> {
  // Detect Electron

  return new Promise<void>((resolve, reject) => {
    // Alicorn/Starlight uses port 16814 to exchange data
    WEBSOCKET_CLIENT = new WebSocket("ws://localhost:16814/");
    WEBSOCKET_CLIENT.onerror = (e) => {
      console.log(e);
      reject();
    };
    WEBSOCKET_CLIENT.onopen = () => {
      console.log("OPENED: Starlight <============> Alicorn");
      resolve();
    };
    WEBSOCKET_CLIENT.onclose = () => {
      console.log("CLOSED: Starlight <            > Alicorn");
    };
    // WebSocket can only transfer string
    // Send back string -> Object
    // { eid: <Task id>, value: <any>}
    WEBSOCKET_CLIENT.onmessage = (e) => {
      const data = JSON.parse(String(e.data));
      if (typeof data.eid === "number") {
        const f = TSS.get(data.eid);
        TSS.delete(data.eid);
        if (typeof f === "function") {
          f(data.value);
        }
      }
    };
  });
}

export async function invoke(
  channel: string,
  ...args: unknown[]
): Promise<unknown> {
  const taskId = ++cEvent;
  WEBSOCKET_CLIENT?.send(
    JSON.stringify({
      eid: taskId,
      channel: channel,
      args: args,
    })
  );
  return new Promise<unknown>((resolve) => {
    TSS.set(taskId, resolve);
  });
}
