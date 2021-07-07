// A mirror is a set of rules which replace url
// A downloader does not include mirror applying
// Reflecting has to be done manually

import { loadData, saveDefaultData } from "../config/DataSupport";
import { parseMap } from "../commons/MapUtil";
import { getString } from "../config/ConfigSupport";

const MIRROR_FILES = ["mcbbs.ald", "tss.ald", "bmclapi.ald"];
let mirrorMap: Map<string, string> = new Map();

export function applyMirror(url: string): string {
  for (const [k, v] of mirrorMap.entries()) {
    const rx = new RegExp(k);
    if (rx.test(url)) {
      return url.replace(rx, v); // This is considered faster a bit
    }
  }
  return url;
}

export async function loadMirror(): Promise<void> {
  await Promise.allSettled(
    MIRROR_FILES.map((f) => {
      saveDefaultData(f);
    })
  );
  mirrorMap = parseMap(
    await loadData(
      getString("download.mirror", "mcbbs").toLowerCase().trim() + ".ald" ||
        MIRROR_FILES[0]
    )
  );
}
