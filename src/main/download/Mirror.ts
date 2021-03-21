// A mirror is a set of rules which replace url
// A downloader does not include mirror applying
// Reflecting has to be done manually

import { loadData, saveData, saveDefaultData } from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";

const MIRROR_FILE = "mirrors.ald";
let mirrorMap: Map<string, string> = new Map();

export function applyMirror(url: string): string {
  for (const [k, v] of mirrorMap.entries()) {
    url = url.replace(k, v);
  }
  return url;
}

export async function saveMirror(): Promise<void> {
  await saveData(MIRROR_FILE, buildMap(mirrorMap));
}

export async function loadMirror(): Promise<void> {
  await saveDefaultData(MIRROR_FILE);
  mirrorMap = parseMap(await loadData(MIRROR_FILE));
}

export function setMirror(mirror: Map<string, string>): void {
  mirrorMap = mirror;
}

export function addMirror(mirror: Map<string, string>): void {
  for (const [k, v] of mirror.entries()) {
    mirrorMap.set(k, v);
  }
}
