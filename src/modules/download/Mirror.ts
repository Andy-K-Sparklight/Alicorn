// A mirror is a set of rules which replace url
// A downloader does not include mirror applying
// Reflecting has to be done manually

import {
  loadData,
  saveData,
  saveDataSync,
  saveDefaultData,
} from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";
import { markMixinSync } from "../ext/Mixin";

const MIRROR_FILE = "mirrors.ald";
let mirrorMap: Map<string, string> = new Map();

export function applyMirror(url: string): string {
  const ogc = { end: false, map: mirrorMap, url: url };
  markMixinSync("applyMirror", "AfterStart", ogc);
  if (ogc.end) {
    return ogc.url;
  }
  for (const [k, v] of mirrorMap.entries()) {
    const rx = new RegExp(k);
    if (rx.test(url)) {
      const ru = url.replace(rx, v);
      const ogc = { map: mirrorMap, url: ru };
      markMixinSync("applyMirror", "BeforeEnd", ogc);
      return ogc.url; // This is considered faster a bit
    }
  }
  const ogc2 = { map: mirrorMap, url: url };
  markMixinSync("applyMirror", "BeforeEnd", ogc2);
  return ogc2.url;
}

export function saveMirrorSync(): void {
  saveDataSync(MIRROR_FILE, buildMap(mirrorMap));
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
