import { tgz } from "compressing";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { isFileExist } from "../commons/FileUtil";
import { getActualDataPath } from "../config/DataSupport";
import { DownloadMeta } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";

// Support for ARM devices

const LOCAL_ARM_PACKAGE = "natives-arm64-linux";
const LOCAL_ARM_PACKAGE_CACHE = "natives-arm64-linux.tar.gz";
const REMOTE =
  "https://cdn.jsdelivr.net/gh/AlicornUnionMC/ARMChair@main/natives-arm64-linux.tar.gz";

// Download the prebuilt package
export async function fetchARMPackage(): Promise<boolean> {
  try {
    if (os.arch() !== "arm64" || os.platform() !== "linux") {
      // Obviously
      return false;
    }
    const cache = getActualDataPath(LOCAL_ARM_PACKAGE_CACHE);
    const dir = getActualDataPath(LOCAL_ARM_PACKAGE);
    if ((await wrappedDownloadFile(new DownloadMeta(REMOTE, cache))) !== 1) {
      return false;
    }
    await tgz.uncompress(cache, dir);
    return true;
  } catch {
    return false;
  }
}

// Get the file stored in package
async function findProperARMFile(file: string): Promise<string> {
  const pd = path.join(getActualDataPath(LOCAL_ARM_PACKAGE), file);
  if (await isFileExist(pd)) {
    return pd;
  }
  return "";
}

export async function insertARMPackage(dest: string): Promise<void> {
  const natives = await fs.readdir(dest);
  await Promise.allSettled(
    natives.map(async (n) => {
      const fr = await findProperARMFile(n);
      if (fr) {
        const d = path.join(dest, n);
        await fs.remove(d);
        await fs.copyFile(fr, d);
      }
    })
  );
}
