import path from "path";
import { loadData, saveData, saveDefaultData } from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";

let GlobalContainerDescriptorTable: Map<string, string> = new Map();
const GDT_NAME = "global-container-descriptor.ald";

// '.ald' stands for Alicorn Data

export abstract class Container {
  id: string;
  rootDir: string;

  protected constructor(rootDir: string, id: string) {
    this.id = id;
    this.rootDir = rootDir;
  }

  abstract resolvePath(relativePath: string): string;
}

export function getAllContainers(): string[] {
  return Array.from(GlobalContainerDescriptorTable.keys());
}

export function rootOf(containerID: string): string {
  return GlobalContainerDescriptorTable.get(containerID) || path.resolve();
}

export function registerContainer(container: Container): void {
  GlobalContainerDescriptorTable.set(container.id, container.rootDir);
}

export function unregisterContainer(id: string): void {
  GlobalContainerDescriptorTable.delete(id);
}

export async function loadGDT(): Promise<void> {
  await saveDefaultData(GDT_NAME);
  const gdtData = await loadData(GDT_NAME);
  GlobalContainerDescriptorTable = parseMap(gdtData);
}

export async function saveGDT(): Promise<void> {
  await saveData(GDT_NAME, buildMap(GlobalContainerDescriptorTable));
}
