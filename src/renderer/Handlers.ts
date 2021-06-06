import { ipcRenderer } from "electron";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";

export function registerHandlers(): void {
  addHandler("GetAllInstalledCores", async () => {
    return await scanCoresInAllMountedContainers();
  });
}

export function addHandler(
  channel: string,
  handler: (args?: unknown) => Promise<unknown>
): void {
  ipcRenderer.on(channel, async (e, eid: number, arg: unknown) => {
    try {
      ipcRenderer.sendTo(e.senderId, channel + eid, await handler(arg));
    } catch {
      ipcRenderer.sendTo(e.senderId, channel + eid, undefined);
    }
  });
}
