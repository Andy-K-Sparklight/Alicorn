import { schedulePromiseTask } from "../../renderer/Schedule";
import { ALICORN_DATA_SUFFIX } from "../commons/Constants";
import { buildMap, parseMap } from "../commons/MapUtil";
import { loadData, saveData, saveDataSync } from "../config/DataSupport";
import { MinecraftContainer } from "./MinecraftContainer";

let GlobalContainerDescriptorTable: Map<string, string> = new Map();
const GDT_NAME = "global-container-descriptor" + ALICORN_DATA_SUFFIX;
let GlobalMountDescriptorTable: Map<string, boolean> = new Map();
const GMT_NAME = "global-mount-descriptor" + ALICORN_DATA_SUFFIX;

// GDT stands for Global container Descriptor Table

export function getAllContainers(): string[] {
  return Array.from(GlobalContainerDescriptorTable.keys());
}

export function getAllContainerPaths(): string[] {
  return Array.from(GlobalContainerDescriptorTable.values());
}

export function rootOf(containerID: string): string {
  return GlobalContainerDescriptorTable.get(containerID) || "";
}

let ContainerCacheTable: Map<string, MinecraftContainer> = new Map();

export function getContainer(containerID: string): MinecraftContainer {
  if (ContainerCacheTable.has(containerID)) {
    return ContainerCacheTable.get(containerID) as MinecraftContainer;
  }
  let c = new MinecraftContainer(rootOf(containerID), containerID);
  ContainerCacheTable.set(containerID, c);
  return c;
}

export function registerContainer(container: MinecraftContainer): void {
  GlobalContainerDescriptorTable.set(container.id, container.rootDir);
  GlobalMountDescriptorTable.set(container.id, true);
  void schedulePromiseTask(async () => {
    getContainer(container.id);
  });
}

export function getAllMounted(): string[] {
  const r = [];
  for (const c of GlobalContainerDescriptorTable.keys()) {
    if (isMounted(c)) {
      r.push(c);
    }
  }
  return r;
}

export function unregisterContainer(id: string): void {
  GlobalContainerDescriptorTable.delete(id);
  GlobalMountDescriptorTable.delete(id);
  ContainerCacheTable.delete(id);
  syncGDTGMT();
}

export function isMounted(id: string): boolean {
  const ret = GlobalMountDescriptorTable.get(id);
  if (ret === undefined) {
    return true;
  }
  return ret;
}

export function mount(id: string): void {
  GlobalMountDescriptorTable.set(id, true);
  syncGDTGMT();
}

export function unmount(id: string): void {
  GlobalMountDescriptorTable.set(id, false);
  syncGDTGMT();
}

export async function loadGDT(): Promise<void> {
  GlobalMountDescriptorTable = parseMap(await loadData(GMT_NAME));
  GlobalContainerDescriptorTable = parseMap(await loadData(GDT_NAME));
  syncGDTGMT();
}

export function saveGDTSync(): void {
  syncGDTGMT();
  saveDataSync(GMT_NAME, buildMap(GlobalMountDescriptorTable));
  saveDataSync(GDT_NAME, buildMap(GlobalContainerDescriptorTable));
}

export async function saveGDT(): Promise<void> {
  syncGDTGMT();
  await saveData(GMT_NAME, buildMap(GlobalMountDescriptorTable));
  await saveData(GDT_NAME, buildMap(GlobalContainerDescriptorTable));
}

function syncGDTGMT(): void {
  const nMap = new Map<string, boolean>();
  for (const n of GlobalContainerDescriptorTable.keys()) {
    nMap.set(n, GlobalMountDescriptorTable.get(n) || true);
  }
}
