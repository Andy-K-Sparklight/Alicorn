import path from "path";
import { MOJANG_VERSIONS_MANIFEST, ReleaseType } from "../../commons/Constants";
import { safeGet } from "../../commons/Null";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DownloadMeta } from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { xgot } from "../../download/GotWrapper";
import { ensureClient } from "../../launch/Ensurance";
import { loadProfile } from "../../profile/ProfileLoader";
export const MOJANG_CORES_KEY = "MojangCores";

export async function getAllMojangCores(
  filter = ReleaseType.RELEASE,
  noTimeout = false
): Promise<string[]> {
  try {
    const mObj =
      // @ts-ignore
      window[MOJANG_CORES_KEY] ||
      (await xgot(MOJANG_VERSIONS_MANIFEST, false, false, noTimeout));
    const arr = safeGet(mObj, ["versions"], []);
    const all = new Set<string>();
    if (arr instanceof Array) {
      // @ts-ignore
      window[MOJANG_CORES_KEY] = Object.assign({}, mObj);
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
    const mObj = await xgot(MOJANG_VERSIONS_MANIFEST, true);
    return String(safeGet(mObj, ["latest", filter], ""));
  } catch {
    return "";
  }
}

export async function getProfileURLById(id: string): Promise<string> {
  try {
    const mObj = await xgot(MOJANG_VERSIONS_MANIFEST, false, false);
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

export async function downloadProfile(
  url: string,
  container: MinecraftContainer,
  version: string
): Promise<void> {
  try {
    const profilePath = path.join(
      container.getVersionRoot(version),
      version + ".json"
    );
    const m = new DownloadMeta(url, profilePath);
    await wrappedDownloadFile(m, true);
    // Ensure client
    const p = await loadProfile(version, container);
    await ensureClient(p);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
/**
 * @deprecated
 */
export async function getProfile(
  url: string
): Promise<Record<string, unknown>> {
  return (await xgot(url)) as Record<string, unknown>;
}

export async function prefetchMojangVersions(): Promise<void> {
  await getAllMojangCores(ReleaseType.RELEASE, true);
}
