import os from "os";

const ALICORN_SEPARATOR = "\u2764\u2764";

// Separator '❤❤' is just a choice
// MapUtil will only be used in our code, not for plugins or user data
// In that case, we shall use JSON instead

export function parseMap(str: string): Map<string, string> {
  const entries = str.trim().split(os.EOL);
  const freshMap: Map<string, string> = new Map();
  for (const e of entries) {
    const entTuple = e.trim().split(ALICORN_SEPARATOR);
    freshMap.set(entTuple[0] || "", entTuple[1] || "");
  }
  return freshMap;
}

export function buildMap(map: Map<string, string>): string {
  const stringGroup = [];
  for (const [k, v] of map.entries()) {
    stringGroup.push(k + ALICORN_SEPARATOR + v);
  }
  return stringGroup.join(os.EOL);
}
