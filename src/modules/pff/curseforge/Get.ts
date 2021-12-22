import { invokeWorker } from "../../../renderer/Schedule";
import { safeGet } from "../../commons/Null";
import { pgot } from "../../download/GotWrapper";
import { GAME_ID } from "./Values";

// With modpack
export async function moreAddonInfoBySlug(
  slug: string,
  apiBase: string,
  extraParams: string,
  pageSize: string | number,
  timeout: number
): Promise<ExtraAddonInfo[]> {
  const ACCESS_URL =
    apiBase +
    `/api/v2/addon/search?gameId=${GAME_ID}&pageSize=${pageSize}&searchFilter=${slug}&sort=1${extraParams}`;
  try {
    const r = await pgot(ACCESS_URL, timeout);
    if (!(r instanceof Array)) {
      return [];
    }
    if (r.length === 0) {
      return [];
    }
    const o: ExtraAddonInfo[] = [];
    r.forEach((i) => {
      const c = safeGet(i, ["categorySection", "id"], 0);
      const p = safeGet(i, ["categorySection", "name"], "");
      if (c === 8 || p === "Mods") {
        i.type = "MOD";
      } else if (c === 11 || p === "Modpacks") {
        i.type = "MODPACK";
      } else {
        return;
      }
      i["thumbNail"] = ""; // Fix thumbnail
      if (i["attachments"] instanceof Array) {
        if (i["attachments"][0]) {
          if (i["attachments"][0]["thumbnailUrl"]) {
            i["thumbNail"] = i["attachments"][0]["thumbnailUrl"];
          }
        }
      }
      const lf = i.latestFiles;
      if (!(lf instanceof Array)) {
        i.url = "";
      } else {
        let d: Date = new Date(0);
        let ou = "";
        lf.forEach((v) => {
          if (!v.downloadUrl) {
            return;
          }
          const d2 = new Date(String(v.fileDate));
          if (d2.getTime() > d.getTime()) {
            d = d2;
            ou = String(v.downloadUrl);
          }
        });
        i.url = ou;
      }

      o.push(i);
    });

    return o;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getAddonInfoBySlug(
  slug: string,
  apiBase: string,
  extraParams: string,
  pageSize: string | number,
  exact: boolean,
  timeout: number
): Promise<AddonInfo | undefined> {
  const ACCESS_URL =
    apiBase +
    `/api/v2/addon/search?gameId=${GAME_ID}&pageSize=${pageSize}&searchFilter=${slug}&sort=1${extraParams}`;
  try {
    const r = await pgot(ACCESS_URL, timeout);
    if (!(r instanceof Array)) {
      return undefined;
    }
    if (r.length === 0) {
      return undefined;
    }
    for (const i of r) {
      if (i["slug"] === slug.toLowerCase()) {
        if (
          safeGet(i, ["categorySection", "id"], 0) !== 8 &&
          safeGet(i, ["categorySection", "name"], "") !== "Mods"
        ) {
          // 8 means mods and 11 means modpacks
          continue;
        }
        if (typeof i["id"] === "string" || typeof i["id"] === "number") {
          i["thumbNail"] = "";
          if (i["attachments"] instanceof Array) {
            if (i["attachments"][0]) {
              if (i["attachments"][0]["thumbnailUrl"]) {
                i["thumbNail"] = i["attachments"][0]["thumbnailUrl"];
              }
            }
          }
          return i as AddonInfo;
        }
      }
    }

    if (!exact) {
      let lowest: number | undefined = undefined;
      let lowestId = "";
      let lowestSlug = "";
      let lowestObject: AddonInfo | undefined = undefined;
      for (const i of r) {
        if (
          safeGet(i, ["categorySection", "id"], 0) !== 8 &&
          safeGet(i, ["categorySection", "name"], "") !== "Mods"
        ) {
          // 8 means mods and 11 means modpacks
          continue;
        }
        i["thumbNail"] = "";
        if (i["attachments"] instanceof Array) {
          if (i["attachments"][0]) {
            if (i["attachments"][0]["thumbnailUrl"]) {
              i["thumbNail"] = i["attachments"][0]["thumbnailUrl"];
            }
          }
        }
        const aRank = await strDiff(i["slug"], slug.toLowerCase());
        if (lowestId.length === 0) {
          lowestId = String(i["id"]);
        }
        if (lowestSlug.length === 0) {
          lowestSlug = i["slug"];
        }
        if (lowestObject === undefined) {
          lowestObject = i as AddonInfo;
        }
        if (lowest === undefined) {
          lowest = aRank;
        } else {
          if (aRank < lowest) {
            lowest = aRank;
            if (typeof i["id"] === "string" || typeof i["id"] === "number") {
              lowestId = String(i["id"]);
              lowestSlug = i["slug"];
              lowestObject = i as AddonInfo;
            }
          }
        }
      }
      if (
        lowestId.length > 0 &&
        lowest !== undefined &&
        lowestObject !== undefined
      ) {
        return lowestObject;
      }
    }

    return undefined;
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

async function strDiff(str1: string, str2: string): Promise<number> {
  return (await invokeWorker("StrDiff", str1, str2)) as number;
}

export interface ExtraAddonInfo extends AddonInfo {
  type: "MODPACK" | "MOD";
  url: string;
}

export interface AddonInfo {
  id: number;
  name: string;
  websiteUrl: string;
  slug: string;
  gameVersionLatestFiles: GameVersionFilesIndex[];
  defaultFileId: number;
  thumbNail: string;
}

/*
export interface Dependency {
  id: number;
  addonId: number;
  fileId: number;
}*/

export interface File {
  id: number;
  displayName: string;
  fileName: string;
  fileDate: string;
  fileLength: number;
  // dependencies: Dependency[];
  gameVersion: string[];
  downloadUrl: string;
}

interface GameVersionFilesIndex {
  gameVersion: string;
  projectFileId: number;
  modLoader: number;
}

export async function lookupFileInfo(
  addon: AddonInfo,
  fileId: number | string,
  apiBase: string,
  timeout: number
): Promise<File | undefined> {
  const ACCESS_URL = apiBase + `/api/v2/addon/${addon.id}/file/${fileId}`;
  try {
    const r = (await pgot(ACCESS_URL, timeout)) as Record<string, unknown>;
    if (
      r["id"] !== undefined &&
      r["fileName"] !== undefined &&
      r["fileDate"] !== undefined &&
      r["downloadUrl"] !== undefined
    ) {
      return r as unknown as File;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function lookupAddonInfo(
  addonId: number | string,
  apiBase: string,
  timeout: number
): Promise<AddonInfo | undefined> {
  const ACCESS_URL = apiBase + `/api/v2/addon/${addonId}`;
  try {
    const r = (await pgot(ACCESS_URL, timeout)) as Record<string, unknown>;
    if (
      r["id"] !== undefined &&
      r["name"] !== undefined &&
      r["slug"] !== undefined
    ) {
      r["thumbNail"] = "";
      if (r["attachments"] instanceof Array) {
        if (r["attachments"][0]) {
          if (r["attachments"][0]["thumbnailUrl"]) {
            r["thumbNail"] = r["attachments"][0]["thumbnailUrl"];
          }
        }
      }
      return r as unknown as AddonInfo;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
