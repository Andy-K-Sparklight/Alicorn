/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from "electron";

const VALUE_TABLE = new Map<string, any>();
const VALUE_SETTER_TABLE = new Map<string, (v: any) => any>();
const VALUE_LISTENERS = new Map<string, Map<string, (v: any) => any>>();

export function registerXValue<T>(
  id: string,
  current: T,
  setter: (newValue: T) => void
): void {
  VALUE_TABLE.set(id, current);
  VALUE_SETTER_TABLE.set(id, setter);
  // Notify all
  const ls = VALUE_LISTENERS.get(id);
  if (ls) {
    if (ls.size > 0) {
      for (const f of ls.values()) {
        try {
          f(current);
        } catch {}
      }
    }
  }
}

export function initValueEventsFromMain(): void {
  ipcRenderer.on("setValueX", (_e, id, data, cid) => {
    VALUE_TABLE.set(id, data);
    const st = VALUE_SETTER_TABLE.get(id);
    if (st) {
      st(data);
    }
    ipcRenderer.send("setValueXOK-" + cid);
  });

  ipcRenderer.on("getValueX", (_e, id, cid) => {
    ipcRenderer.send("getValueXOK-" + cid, VALUE_TABLE.get(id));
  });

  ipcRenderer.on("subscribeValueX", (_e, id, eventName) => {
    let m = VALUE_LISTENERS.get(id);
    if (!m) {
      m = new Map();
      VALUE_LISTENERS.set(id, m);
    }
    m.set(eventName, (v: any) => {
      ipcRenderer.send(`subscribeResultX-${id}-${eventName}`, v);
    });
  });

  ipcRenderer.on("unsubscribeValueX", (_e, id, eventName) => {
    const m = VALUE_LISTENERS.get(id);
    if (!m) {
      return;
    }
    m.delete(eventName);
    // No need to set again, it's a reference!
  });
}
