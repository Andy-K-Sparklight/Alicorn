import { GAME_ID } from "./Values";
import leven from "js-levenshtein";
import mdiff from "mdiff";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { findCachedFile, writeCachedFile } from "./Cache";
import { copyFile, ensureDir } from "fs-extra";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { DownloadMeta } from "../../download/AbstractDownloader";
import path from "path";
import { pgot } from "../../download/GotWrapper";

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
        i["thumbNail"] = "";
        if (i["attachments"] instanceof Array) {
          if (i["attachments"][0]) {
            if (i["attachments"][0]["thumbnailUrl"]) {
              i["thumbNail"] = i["attachments"][0]["thumbnailUrl"];
            }
          }
        }
        const aRank = strDiff(i["slug"], slug.toLowerCase());
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

export function strDiff(str1: string, str2: string): number {
  const ed = leven(str1, str2);
  const lcs = mdiff(str1, str2).getLcs()?.length || 0;
  return ed * 2 - lcs * 8 + 30 + str2.length;
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

export interface GameVersionFilesIndex {
  gameVersion: string;
  projectFileId: number;
  modLoader: number;
}

export function getLatestFileByVersion(
  addonInfo: AddonInfo,
  gameVersion: string,
  allowDefault = true
): number {
  if (gameVersion === "") {
    if (!allowDefault) {
      return 0;
    }
    return addonInfo.defaultFileId;
  }
  const indexes = addonInfo.gameVersionLatestFiles;
  for (const i of indexes) {
    if (i.gameVersion === gameVersion) {
      return i.projectFileId;
    }
  }
  return 0;
}

export async function requireFile(
  file: File,
  addon: AddonInfo,
  cacheRoot: string,
  container: MinecraftContainer
): Promise<boolean> {
  const cache = await findCachedFile(file, addon, cacheRoot);
  const modJar = container.getModJar(file.fileName);
  if (cache) {
    try {
      await ensureDir(path.dirname(modJar));
      await copyFile(cache, modJar);
      return true;
    } catch (e) {
      console.log(e);
    }
  }
  const st = await wrappedDownloadFile(
    new DownloadMeta(file.downloadUrl, modJar)
  );
  if (st === 1) {
    await writeCachedFile(file, addon, cacheRoot, modJar);
    return true;
  }
  return false;
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
