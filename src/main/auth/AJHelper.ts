import { resolveDataFilePath } from "../config/DataSupport";
import { DownloadMeta, DownloadStatus } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import fs from "fs-extra";
import objectHash from "object-hash";
import { safeGet } from "../commons/Null";
import { xgot } from "../download/GotWrapper";

const AJ_MANIFEST = "https://authlib-injector.yushi.moe/artifacts.json";
const AJ_ARTIFACT_ROOT =
  "https://authlib-injector.yushi.moe/artifact/${build}.json";
export const AJ_FILE_BASE = "authlib-injector.alicorn.jar";

// Download the latest Authlib Injector
export async function getLatestAJ(): Promise<boolean> {
  try {
    const manifest = await xgot(AJ_MANIFEST);
    // @ts-ignore
    const latestBuild = String(manifest["latest_build_number"]);
    const index = await xgot(AJ_ARTIFACT_ROOT.replace("${build}", latestBuild));

    // @ts-ignore
    const url = String(index["download_url"]);
    const checkSum = String(safeGet(index, ["checksums", "sha256"]));
    const dest = resolveDataFilePath(AJ_FILE_BASE);
    if (
      (await wrappedDownloadFile(new DownloadMeta(url, dest, ""))) ===
      DownloadStatus.RESOLVED
    ) {
      const data = await fs.readFile(dest);
      if (checkSum === objectHash(data, { algorithm: "sha256" })) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function whereAJ(): string {
  return resolveDataFilePath(AJ_FILE_BASE);
}
