// UNCHECKED

export function parseStringMap(obj: unknown): Map<string, string> {
  const res: Map<string, string> = new Map();
  if (typeof obj === "object") {
    const allProperties = Object.getOwnPropertyNames(obj);
    for (const p of allProperties) {
      // @ts-ignore
      res.set(p, String(obj[p]));
    }
  }
  return res;
}

export function buildStringMap(
  map: Map<string, string>
): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of map.entries()) {
    obj[k] = v;
  }
  return obj;
}
