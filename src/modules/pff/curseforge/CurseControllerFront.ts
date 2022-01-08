import { ipcRenderer } from "electron";
import { ModArtifact, ModMeta } from "../virtual/ModDefine";

export function queryModByName(query: string): Promise<string> {
  return ipcRenderer.invoke("curseQueryModByName", query);
}

export function queryModInfoBySlug(
  slug: string
): Promise<[ModMeta, ModArtifact[]]> {
  return ipcRenderer.invoke("curseQueryModInfoBySlug", slug);
}

export async function deicdeFullInformation(
  origin: ModArtifact
): Promise<void> {
  const n = await ipcRenderer.invoke("curseDecideFullInformation", origin);
  Object.assign(origin, n);
}

export function apiHasGone(): boolean {
  return new Date().getTime() > 1643673599000; // 2022-1-31 23:59:59 GMT
}
