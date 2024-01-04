import { zip } from "compressing";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { isFileExist } from "../commons/FileUtil";
import { buildMap, parseMap } from "../commons/MapUtil";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { updateRecord } from "../container/ValidateRecord";
import { existsAndValidateRaw } from "../download/DownloadWrapper";
import { getHash } from "../download/Validate";
import {
  ArtifactMeta,
  getCurrentOSNameAsMojang,
  LibraryMeta,
} from "../profile/Meta";
import { insertARMPackage } from "./ARMChair";

export const JAR_SUFFIX = ".jar";
const META_INF = "META-INF";
const GIT_SUFFIX = ".git";
const CHECKSUM_SUFFIX = ".sha1";
const NATIVES_LOCK_FILE = "natives.lock.ald";

// Extracts one native library and remove '.git' and '.sha1' files
// We should validate hash, but it's unnecessary
export async function checkExtractTrimNativeLocal(
  container: MinecraftContainer,
  id: string,
  nativeArtifact: ArtifactMeta
): Promise<void> {
  try {
    const srcFile = container.getLibraryPath(nativeArtifact.path);
    const dest = container.getNativesLocation(id);
    await fs.ensureDir(dest);
    if (await checkLockFile(dest)) {
      return;
    }
    try {
      await zip.uncompress(srcFile, dest);
    } catch {}
    const filesToTrim = await fs.readdir(dest);
    for (const f of filesToTrim) {
      if (
        f === META_INF ||
        f.endsWith(GIT_SUFFIX) ||
        f.endsWith(CHECKSUM_SUFFIX)
      ) {
        await fs.remove(path.join(dest, f));
      }
    }
    if (os.arch() === "arm64" && os.platform() === "linux") {
      // TODO: unchecked
      await insertARMPackage(dest);
    }
    await saveLockFile(dest);
  } catch {
    return;
  }
}

// Get the native artifact of a library according to the 'osName'
// If the library is not a native library, this will return an empty one
export function getNativeArtifact(
  libraryMeta: LibraryMeta,
  osName?: string
): ArtifactMeta {
  osName = osName || getCurrentOSNameAsMojang();
  if (libraryMeta.isNative) {
    switch (osName) {
      case "windows":
        return (
          libraryMeta.classifiers.nativesWindows ||
          ArtifactMeta.emptyArtifactMeta()
        );
      case "osx":
        return (
          libraryMeta.classifiers.nativesMacOS ||
          ArtifactMeta.emptyArtifactMeta()
        );
      case "linux":
      default:
        return (
          libraryMeta.classifiers.nativesLinux ||
          ArtifactMeta.emptyArtifactMeta()
        );
    }
  } else {
    return ArtifactMeta.emptyArtifactMeta();
  }
}

// A lockfile which contains the '.dll's(or '.so's) filename and their hashes
// If this file exists, we shall check whether the required files exist
// If not, we shall re-extract '...-natives.jar' and regenerate lockfile
async function checkLockFile(dir: string): Promise<boolean> {
  const lPath = path.join(dir, NATIVES_LOCK_FILE);
  if (!(await isFileExist(lPath))) {
    return false;
  }
  const fMap = parseMap((await fs.readFile(lPath)).toString());
  const pStack: Promise<boolean>[] = [];
  for (const [f, s] of fMap.entries()) {
    const cPath = path.resolve(path.join(dir, f));
    pStack.push(
      new Promise<boolean>((resolve) => {
        existsAndValidateRaw(cPath, String(s))
          .then((b) => {
            resolve(b);
          })
          .catch(() => {
            resolve(false);
          });
      })
    );
  }
  for (const x of await Promise.all(pStack)) {
    if (!x) {
      return false;
    }
  }
  return true;
}

async function saveLockFile(dir: string): Promise<void> {
  const lPath = path.join(dir, NATIVES_LOCK_FILE);
  if (await isFileExist(lPath)) {
    await fs.remove(lPath);
  }
  const dirFiles = await fs.readdir(dir);
  const fMap = new Map<string, string>();
  await Promise.all(
    dirFiles.map((f) => {
      return new Promise<void>((resolve) => {
        const pt = path.resolve(path.join(dir, f));
        void getHash(pt).then((s) => {
          updateRecord(pt);
          fMap.set(f, s);
          resolve();
        });
      });
    })
  );
  await fs.outputFile(lPath, buildMap(fMap), { mode: 0o777 });
}
