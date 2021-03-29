const NULL_OBJECTS = new Set<unknown>();

export function registerNullObject(obj: unknown): void {
  NULL_OBJECTS.add(obj);
}

export function isNull(obj: unknown): boolean {
  try {
    return (
      obj === undefined ||
      obj === null ||
      obj === "" ||
      NULL_OBJECTS.has(obj) ||
      // @ts-ignore
      obj.length === 0
    );
  } catch {
    return false;
  }
}

export function safeGet(
  obj: unknown,
  properties: string[],
  def: unknown = null
): unknown {
  try {
    let node = obj;
    for (const x of properties) {
      // @ts-ignore
      node = node[x];
    }
    return node;
  } catch {
    return def;
  }
}
