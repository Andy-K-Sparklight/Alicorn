// A mirror is a set of rules which replace url
// A downloader does not include mirror applying
// Reflecting has to be done manually

import { parseMap } from "../commons/MapUtil";
import { getString } from "../config/ConfigSupport";
import { loadData, saveDefaultData } from "../config/DataSupport";

const BLACKLIST_URL: Set<string> = new Set();

const MIRROR_FILES = [
  "alicorn-mcbbs-nonfree.ald",
  "alicorn-bmclapi-nonfree.ald",
  "alicorn.ald",
];
const mirrors: Map<string, string>[] = [];
let mirrorMap: Map<string, string> = new Map();
const METHOD_KEY = "@method";
const NO_MIRROR_VAL = "@no-mirror";
const CURRENT_LINX_REGEX = "[REGEX]";
const CURRENT_LINX_EXACT = "[EXACT]";
export function applyMirror(url: string, mirror = mirrorMap): string {
  const useRegex = mirror.get(METHOD_KEY) === "regex";
  for (const [k, v] of mirror.entries()) {
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
    } else if (k.startsWith(CURRENT_LINX_REGEX)) {
      const rx = new RegExp(k.slice(CURRENT_LINX_REGEX.length));
      if (rx.test(url)) {
        if (v === NO_MIRROR_VAL) {
          return url;
        }
        return url.replace(rx, v);
      }
    } else if (k.startsWith(CURRENT_LINX_EXACT)) {
      const rx = k.slice(CURRENT_LINX_EXACT.length);
      if (url === rx) {
        if (v === NO_MIRROR_VAL) {
          return url;
        }
        return v;
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
    MIRROR_FILES.map(async (f) => {
      await saveDefaultData(f);
    })
  );
  const mf = getString("download.mirror", "none").toLowerCase().trim();
  if (mf === "none") {
    mirrorMap = new Map();
  }
  mirrorMap = parseMap(await loadData(mf + ".ald"));
}

export async function loadAllMirrors(): Promise<void> {
  mirrors.push(mirrorMap); // First choice
  await Promise.allSettled(
    MIRROR_FILES.map(async (f) => {
      await saveDefaultData(f);
      mirrors.push(parseMap(await loadData(f)));
    })
  );
}

export class MirrorChain {
  url: string;
  cIndex = 0;
  constructor(url: string) {
    this.url = url;
  }
  mirror(): string {
    const mf = getString("download.mirror", "none").toLowerCase().trim();
    if (mf === "none") {
      return this.url;
    }
    let m = applyMirror(this.url, mirrors[this.cIndex] || new Map());
    while (BLACKLIST_URL.has(m) && mirrors[this.cIndex] !== undefined) {
      m = applyMirror(this.url, mirrors[this.cIndex] || new Map());
      this.next();
    }
    return m;
  }
  next(): void {
    this.cIndex++;
  }
  markBad(): void {
    BLACKLIST_URL.add(applyMirror(this.url, mirrors[this.cIndex] || new Map()));
  }
}
