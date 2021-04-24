import { loadData, saveDataSync } from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";
import { ALICORN_DATA_SUFFIX } from "../commons/Constants";
import { MinecraftContainer } from "./MinecraftContainer";

let GlobalContainerDescriptorTable: Map<string, string> = new Map();
const GDT_NAME = "global-container-descriptor" + ALICORN_DATA_SUFFIX;
let GlobalMountDescriptorTable: Map<string, boolean> = new Map();
const GMT_NAME = "global-mount-descriptor" + ALICORN_DATA_SUFFIX;

// GDT stands for Global container Descriptor Table

export function getAllContainers(): string[] {
  return Array.from(GlobalContainerDescriptorTable.keys());
}

export function rootOf(containerID: string): string {
  return GlobalContainerDescriptorTable.get(containerID) || "";
}

export function getContainer(containerID: string): MinecraftContainer {
  return new MinecraftContainer(rootOf(containerID), containerID);
}

export function hasContainerPt(s: string): boolean {
  return Array.from(GlobalContainerDescriptorTable.values()).includes(s);
}

export function registerContainer(container: MinecraftContainer): void {
  GlobalContainerDescriptorTable.set(container.id, container.rootDir);
  GlobalMountDescriptorTable.set(container.id, true);
}

export function unregisterContainer(id: string): void {
  GlobalContainerDescriptorTable.delete(id);
  GlobalMountDescriptorTable.delete(id);
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

function syncGDTGMT(): void {
  const nMap = new Map<string, boolean>();
  for (const n of GlobalContainerDescriptorTable.keys()) {
    nMap.set(n, GlobalMountDescriptorTable.get(n) || true);
  }
}
