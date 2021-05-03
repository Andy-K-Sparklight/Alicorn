import { getActualDataPath } from "../config/DataSupport";
import { DownloadMeta, DownloadStatus } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import { xgot } from "../download/GotWrapper";
import { isFileExist } from "../config/FileUtil";
import { toBase64 } from "js-base64";
import got from "got";

const AJ_MANIFEST = "https://authlib-injector.yushi.moe/artifacts.json";
const AJ_ARTIFACT_ROOT =
  "https://authlib-injector.yushi.moe/artifact/${build}.json";
export const AJ_FILE_BASE = "authlib-injector.alicorn.jar";

// Download the latest Authlib Injector
export async function getLatestAJ(): Promise<boolean> {
  if (await isFileExist(getActualDataPath(AJ_FILE_BASE))) {
    return true;
  }
  try {
    const manifest = await xgot(AJ_MANIFEST);
    // @ts-ignore
    const latestBuild = String(manifest["latest_build_number"]);
    const index = await xgot(AJ_ARTIFACT_ROOT.replace("${build}", latestBuild));

    // @ts-ignore
    const url = String(index["download_url"]);
    const dest = getActualDataPath(AJ_FILE_BASE);
    // New version of sha no longer supports sha256
    // So we have to give up checking
    return (
      (await wrappedDownloadFile(new DownloadMeta(url, dest, ""))) ===
      DownloadStatus.RESOLVED
    );
  } catch {
    return false;
  }
}

export function whereAJ(): string {
  return getActualDataPath(AJ_FILE_BASE);
}

export async function prefetchData(authServer: string): Promise<string> {
  try {
    return toBase64(
      (await got.get(authServer, { cache: false, responseType: "text" })).body
    );
  } catch {
    return "";
  }
}
