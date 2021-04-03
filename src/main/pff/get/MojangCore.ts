import { MOJANG_VERSIONS_MANIFEST, ReleaseType } from "../../commons/Constants";
import { safeGet } from "../../commons/Null";
import { xgot } from "../../download/GotWrapper";

// UNCHECKED

export async function getAllMojangCores(
  filter = ReleaseType.RELEASE
): Promise<string[]> {
  try {
    const mObj = await xgot(MOJANG_VERSIONS_MANIFEST);
    const arr = safeGet(mObj, ["versions"], []);
    const all = new Set<string>();
    if (arr instanceof Array) {
      for (const v of arr) {
        if (safeGet(v, ["type"]) === filter) {
          all.add(String(safeGet(v, ["id"], "")));
        }
      }
      all.delete("");
      return Array.from(all);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getLatestMojangCore(
  filter = ReleaseType.RELEASE
): Promise<string> {
  try {
    const mObj = await xgot(MOJANG_VERSIONS_MANIFEST);
    return String(safeGet(mObj, ["latest", filter], ""));
  } catch {
    return "";
  }
}

export async function getProfileURLById(id: string): Promise<string> {
  try {
    const mObj = await xgot(MOJANG_VERSIONS_MANIFEST);
    const arr = safeGet(mObj, ["versions"], []);
    if (arr instanceof Array) {
      for (const v of arr) {
        if (safeGet(v, ["id"]) === id) {
          return String(safeGet(v, ["url"], ""));
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}

export async function getProfile(
  url: string
): Promise<Record<string, unknown>> {
  try {
    return Object.assign({}, await xgot(url));
  } catch {
    return {};
  }
}
