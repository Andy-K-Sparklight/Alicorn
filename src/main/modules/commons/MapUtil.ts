import os from "os";
import { ALICORN_SEPARATOR } from "./Constants";

// Separator '❤❤' is just a choice
// MapUtil will only be used in our code, not for plugins or user data
// In that case, we shall use JSON instead
export function parseMap<T = boolean | string | number>(
  str: string
): Map<string, T> {
  const entries = str.trim().split("\n");
  const freshMap: Map<string, T> = new Map();
  for (const e of entries) {
    try {
      if (e.trim() === "") {
        continue;
      }
      const entTuple = e.trim().split(ALICORN_SEPARATOR);
      if (entTuple.length < 2) {
        continue;
      }
      freshMap.set(entTuple[0] || "", JSON.parse(entTuple[1] || ""));
      // eslint-disable-next-line no-empty
    } catch {}
  }
  return freshMap;
}

export function buildMap(map: Map<string, unknown>): string {
  const stringGroup = [];
  for (const [k, v] of map.entries()) {
    stringGroup.push(k + ALICORN_SEPARATOR + String(v));
  }
  return stringGroup.join(os.EOL);
}
