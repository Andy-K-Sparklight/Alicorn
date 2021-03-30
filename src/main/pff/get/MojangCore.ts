import got from "got";
import { ReleaseType, VERSIONS_MANIFEST } from "../../commons/Constants";
import { safeGet } from "../../commons/Null";
import { applyMirror } from "../../download/Mirror";

// UNCHECKED

export async function getAllMojangCores(
  filter = ReleaseType.RELEASE
): Promise<string[]> {
  try {
    const mObj = await got.get(applyMirror(VERSIONS_MANIFEST), {
      responseType: "json",
    });
    const arr = safeGet(mObj.body, ["versions"], []);
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
    const mObj = await got.get(applyMirror(VERSIONS_MANIFEST), {
      responseType: "json",
    });
    return String(safeGet(mObj.body, ["latest", filter], ""));
  } catch {
    return "";
  }
}

export async function getProfileURLById(id: string): Promise<string> {
  try {
    const mObj = await got.get(applyMirror(VERSIONS_MANIFEST), {
      responseType: "json",
    });
    const arr = safeGet(mObj.body, ["versions"], []);
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
    return Object.assign(
      {},
      (await got.get(applyMirror(url), { responseType: "json" })).body
    );
  } catch {
    return {};
  }
}
