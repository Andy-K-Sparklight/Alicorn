import { expose } from "../boticorn/FTable";
import {
  ArtifactMeta,
  AssetIndexArtifactMeta,
  AssetMeta,
  ClassifiersMeta,
  LibraryMeta,
} from "../profile/Meta";

expose({ isNull, safeGet });
export function isNull(obj: unknown): boolean {
  try {
    return (
      obj === undefined ||
      obj === null ||
      obj === "" ||
      obj === "null" ||
      obj === "undefined" ||
      (obj instanceof AssetIndexArtifactMeta && !obj.id) ||
      (obj instanceof ArtifactMeta && !obj.path) ||
      (obj instanceof AssetMeta && !obj.hash) ||
      (obj instanceof LibraryMeta &&
        !obj.name &&
        isNull(obj.artifact) &&
        isNull(obj.classifiers)) ||
      (obj instanceof ClassifiersMeta &&
        isNull(obj.javadoc) &&
        isNull(obj.nativesLinux) &&
        isNull(obj.nativesMacOS) &&
        isNull(obj.nativesWindows) &&
        isNull(obj.sources)) ||
      obj === ArtifactMeta.emptyArtifactMeta() ||
      obj === ClassifiersMeta.emptyClassifiersMeta() ||
      obj === AssetIndexArtifactMeta.emptyAssetIndexArtifactMeta() ||
      // @ts-ignore
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
