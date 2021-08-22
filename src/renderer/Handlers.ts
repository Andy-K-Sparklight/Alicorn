import { ipcRenderer } from "electron";
import { getNumber } from "../modules/config/ConfigSupport";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";
import {
  getAllContainers,
  getContainer,
} from "../modules/container/ContainerUtil";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { CoreInfo } from "../starlight/StarlightFunctions";
import { jumpTo, triggerSetPage } from "./GoTo";

export function registerHandlers(): void {
  addHandler("GetAllInstalledCores", async () => {
    const allCores = await scanCoresInAllMountedContainers();
    const out: Record<string, string[]> = {};
    for (const [c, i] of allCores) {
      out[c.id] = i;
    }
    return out;
  });
  addHandler("GetCoreInfo", async (container, id): Promise<CoreInfo> => {
    const prof = await loadProfile(String(id), getContainer(String(container)));
    return {
      baseVersion: prof.baseVersion,
      id: prof.id,
      container: String(container),
    };
  });
  addHandler("TestServer", async (address) => {
    if (getNumber("starlight.join-server.timeout", 2000) === 0) {
      return true;
    }
    return await ipcRenderer.invoke("isReachable", String(address));
  });
  addHandler("JumpTo", (target, page) => {
    jumpTo(String(target));
    triggerSetPage(String(page));
    return Promise.resolve();
  });
  addHandler("GetAllContainers", () => {
    return Promise.resolve(getAllContainers());
  });
}

export function addHandler(
  channel: string,
  handler: (...args: unknown[]) => Promise<unknown>
): void {
  ipcRenderer.on(channel, async (e, eid: number, args: unknown[]) => {
    try {
      ipcRenderer.sendTo(e.senderId, channel + eid, await handler(...args));
    } catch {
      ipcRenderer.sendTo(e.senderId, channel + eid, undefined);
    }
  });
  ipcRenderer.on(
    channel + "_A_MAIN",
    async (_e, eid: number, args: unknown[]) => {
      try {
        ipcRenderer.send(channel + "_A_MAIN" + eid, await handler(...args));
      } catch {
        ipcRenderer.send(channel + "_A_MAIN" + eid, undefined);
      }
    }
  );
}
