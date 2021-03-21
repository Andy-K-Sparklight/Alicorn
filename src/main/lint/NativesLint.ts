import {
  ArtifactMeta,
  getCurrentOSNameAsMojang,
  LibraryMeta,
} from "../profile/Meta";
import { MinecraftContainer } from "../container/MinecraftContainer";
import path from "path";
import fs from "fs-extra";
import { zip } from "compressing";

export const JAR_SUFFIX = ".jar";
const META_INF = "META-INF";
const GIT_SUFFIX = ".git";
const CHECKSUM_SUFFIX = ".sha1";

// Extracts one native library and remove '.git' and '.sha1' files
// We should validate hash, but it's unnecessary
export async function extractNativeLocalAndTrim(
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
