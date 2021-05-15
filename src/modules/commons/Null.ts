import objectHash from "object-hash";
import { ArtifactMeta, AssetIndexArtifactMeta } from "../profile/Meta";

const NULL_OBJECTS = new Set<string>();

export function registerNullObject(obj: unknown): void {
  NULL_OBJECTS.add(objectHash({ o: obj }));
}

export function isNull(obj: unknown): boolean {
  try {
    return (
      obj === undefined ||
      obj === null ||
      obj === "" ||
      obj === "null" ||
      obj === "undefined" ||
      (obj instanceof AssetIndexArtifactMeta && obj.id === "") ||
      (obj instanceof ArtifactMeta && obj.path === "") ||
      NULL_OBJECTS.has(objectHash({ o: obj })) ||
      (typeof obj === "object" &&
        Object.getOwnPropertyNames(obj).length <= 0) ||
      // @ts-ignore
      obj.length === 0
    );
  } catch {
    return false;
  }
}

export function safeGet(
  obj: unknown,
  properties: (string | number)[],
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
