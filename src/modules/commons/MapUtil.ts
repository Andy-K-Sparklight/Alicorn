import { expose } from "../boticorn/FTable";
import { ALICORN_SEPARATOR } from "./Constants";

// Separator '❤❤' is just a choice
// MapUtil will only be used in our code, not for plugins or user data
// In that case, we shall use JSON instead
expose({ parseMap, buildMap });
export function parseMap<T = boolean | string | number>(
  str: string
): Map<string, T> {
  const entries = str.trim().split("\n"); // Better compatibility
  const freshMap: Map<string, T> = new Map();
  for (const e of entries) {
    try {
      if (e.trim() === "") {
        continue;
      }
      if (e.startsWith("#")) {
        continue;
      }
      const entTuple = e.trim().split(ALICORN_SEPARATOR);
      if (entTuple.length < 2) {
        continue;
      }
      freshMap.set(
        entTuple[0] || "",
        manualParse(entTuple[1] || "") as unknown as T
      );
    } catch {}
  }
  return freshMap;
}

function manualParse(source: string): boolean | number | string {
  if (source === "true") {
    return true;
  }
  if (source === "false") {
    return false;
  }

  const floatParse = parseFloat(source);
  if (!isNaN(floatParse)) {
    return floatParse;
  }
  return source;
}

export function buildMap(map: Map<string, unknown>): string {
  const stringGroup = [];
  for (const [k, v] of map.entries()) {
    stringGroup.push(k + ALICORN_SEPARATOR + String(v));
  }
  return stringGroup.join("\n");
}
