import got from "got";
import { GAME_ID } from "./Values";
import leven from "js-levenshtein";
import mdiff from "mdiff";

export async function getAddonInfoBySlug(
  slug: string,
  apiBase: string,
  extraParams: string,
  pageSize: string,
  exact: boolean,
  threshold: number,
  timeout: number
): Promise<AddonInfo | undefined> {
  const ACCESS_URL =
    apiBase +
    `/api/v2/addon/search?gameId=${GAME_ID}&pageSize=${pageSize}&searchFilter=${slug}&sort=1${extraParams}`;

  try {
    const r = (
      await got.get(ACCESS_URL, { responseType: "json", timeout: timeout })
    ).body;
    if (!(r instanceof Array)) {
      return undefined;
    }
    if (r.length === 0) {
      return undefined;
    }
    for (const i of r) {
      if (i["slug"] === slug.toLowerCase()) {
        if (typeof i["id"] === "string" || typeof i["id"] === "number") {
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
        lowest <= threshold &&
        lowestObject !== undefined
      ) {
        return lowestObject;
      }
    }

    return undefined;
  } catch (e) {
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
}

export interface Dependency {
  id: number;
  addonId: number;
  fileId: number;
}

export interface File {
  id: number;
  displayName: string;
  fileName: string;
  fileDate: string;
  fileLength: number;
  dependencies: Dependency[];
  gameVersion: string[];
  downloadUrl: string;
}

export interface GameVersionFilesIndex {
  gameVersion: string;
  projectFileId: number;
  modLoader: number;
}

export function getLatestFilesByVersion(
  addonInfo: AddonInfo,
  gameVersion: string
): number {
  if (gameVersion === "") {
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

export async function getFileInfo(
  addonInfo: AddonInfo,
  fileId: number,
  apiBase: string,
  timeout: number
): Promise<File | undefined> {
  try {
    return (
      await got.get(apiBase + `/api/v2/addon/${addonInfo.id}/file/${fileId}`, {
        timeout: timeout,
        responseType: "json",
      })
    ).body as File;
  } catch (e) {
    return undefined;
  }
}
