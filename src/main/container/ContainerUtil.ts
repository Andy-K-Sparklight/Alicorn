import path from "path";
import { loadData, saveData } from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";
import { ALICORN_DATA_SUFFIX } from "../commons/Constants";
import { MinecraftContainer } from "./MinecraftContainer";

let GlobalContainerDescriptorTable: Map<string, string> = new Map();
const GDT_NAME = "global-container-descriptor" + ALICORN_DATA_SUFFIX;

// GDT stands for Global container Descriptor Table

export function getAllContainers(): string[] {
  return Array.from(GlobalContainerDescriptorTable.keys());
}

export function rootOf(containerID: string): string {
  return GlobalContainerDescriptorTable.get(containerID) || path.resolve();
}

export function getContainer(containerID: string): MinecraftContainer {
  return new MinecraftContainer(containerID, rootOf(containerID));
}

export function registerContainer(container: MinecraftContainer): void {
  GlobalContainerDescriptorTable.set(container.id, container.rootDir);
}

export function unregisterContainer(id: string): void {
  GlobalContainerDescriptorTable.delete(id);
}

export async function loadGDT(): Promise<void> {
  GlobalContainerDescriptorTable = parseMap(await loadData(GDT_NAME));
}

export async function saveGDT(): Promise<void> {
  await saveData(GDT_NAME, buildMap(GlobalContainerDescriptorTable));
}
