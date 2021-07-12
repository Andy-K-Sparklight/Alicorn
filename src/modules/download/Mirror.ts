// A mirror is a set of rules which replace url
// A downloader does not include mirror applying
// Reflecting has to be done manually

import { loadData, saveDefaultData } from "../config/DataSupport";
import { parseMap } from "../commons/MapUtil";
import { getString } from "../config/ConfigSupport";

const MIRROR_FILES = [
  "mcbbs.ald",
  "tss-mcbbs.ald",
  "bmclapi.ald",
  "alicorn-mcbbs.ald",
];
let mirrorMap: Map<string, string> = new Map();
const METHOD_KEY = "@method";
const NO_MIRROR_VAL = "@no-mirror";

export function applyMirror(url: string): string {
  const useRegex = mirrorMap.get(METHOD_KEY) === "regex";
  for (const [k, v] of mirrorMap.entries()) {
    if (k === METHOD_KEY) {
      continue;
    }
    if (useRegex) {
      const rx = new RegExp(k);
      if (rx.test(url)) {
        if (v === NO_MIRROR_VAL) {
          return url;
        }
        return url.replace(rx, v); // Replace only once
      }
    } else {
      if (url.includes(k)) {
        if (v === NO_MIRROR_VAL) {
          return url;
        }
        return url.replace(k, v);
      }
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
      getString("download.mirror", "mcbbs").toLowerCase().trim() + ".ald"
    )
  );
}
