import {
  ArtifactMeta,
  getCurrentOSNameAsMojang,
  LibraryMeta,
} from "../profile/Meta";
import { MinecraftContainer } from "../container/MinecraftContainer";
import path from "path";
import fs from "fs-extra";
import { zip } from "compressing";
import { isFileExist } from "../config/ConfigSupport";
import { buildMap, parseMap } from "../commons/MapUtil";
import { getHash, validate } from "../download/Validate";

export const JAR_SUFFIX = ".jar";
const META_INF = "META-INF";
const GIT_SUFFIX = ".git";
const CHECKSUM_SUFFIX = ".sha1";
const NATIVES_LOCK_FILE = "natives.lock.ald";

// Extracts one native library and remove '.git' and '.sha1' files
// We should validate hash, but it's unnecessary
export async function checkExtractTrimNativeLocal(
  container: MinecraftContainer,
  nativeArtifact: ArtifactMeta
): Promise<void> {
  try {
    const srcFile = container.getLibraryPath(nativeArtifact.path);
    const dest = container.getLibraryPath(
      path.join(
        path.dirname(nativeArtifact.path),
        path.basename(nativeArtifact.path, JAR_SUFFIX)
      )
    );
    await fs.ensureDir(dest);
    if (await checkLockFile(dest)) {
      return;
    }
    try {
      await zip.uncompress(srcFile, dest);
      // eslint-disable-next-line no-empty
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
        isFileExist(cPath).then((b) => {
          if (!b) {
            resolve(false);
          }
          validate(cPath, s).then((b2) => {
            resolve(b2);
          });
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
        getHash(path.resolve(path.join(dir, f))).then((s) => {
          fMap.set(f, s);
          resolve();
        });
      });
    })
  );
  await fs.writeFile(lPath, buildMap(fMap));
}
