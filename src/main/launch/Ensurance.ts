import { GameProfile } from "../profile/GameProfile";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { ArtifactMeta } from "../profile/Meta";
import {
  extractNativeLocalAndTrim,
  getNativeArtifact,
} from "../lint/NativesLint";
import { DownloadMeta, DownloadStatus } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
// Ensure that native libraries(*.dll) exists
// This is only a try, no GUARANTEE
// DO perform this AFTER 'ensureLibraries'!
// This function DOES NOT check if file already exists
// It only decompress
// We don't count how much resolved
// Because EEXIST will be treated as rejection
// While there actually has no problem
export async function ensureNatives(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<void> {
  const toEnsureLibraries: ArtifactMeta[] = [];
  for (const l of profile.libraries) {
    if (l.isNative && l.canApply()) {
      toEnsureLibraries.push(getNativeArtifact(l));
    }
  }
  await Promise.all(
    (() => {
      const allPromises = [];
      for (const s of toEnsureLibraries) {
        allPromises.push(
          new Promise<void>((resolve) => {
            extractNativeLocalAndTrim(container, s).then(() => {
              resolve();
            });
          })
        );
      }
      return allPromises;
    })()
  );
}

// Ensure libraries
// The return value is the number of failed tasks
export async function ensureLibraries(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<number> {
  const allLibrariesToCheck: ArtifactMeta[] = [];
  for (const l of profile.libraries) {
    if (!l.canApply()) {
      continue;
    }
    allLibrariesToCheck.push(l.artifact);
    if (l.isNative) {
      allLibrariesToCheck.push(getNativeArtifact(l));
    }
  }
  const values = await Promise.all(
    (() => {
      return allLibrariesToCheck.map((artifact) => {
        return performSingleCheck(artifact, container);
      });
    })()
  );
  let failedCount = 0;
  for (const x of values) {
    if (x == DownloadStatus.FAILED) {
      failedCount++;
    }
  }
  return failedCount;
}

// Check one library
// Downloader will check if file already exists
// So, we, don't, care!
async function performSingleCheck(
  artifact: ArtifactMeta,
  container: MinecraftContainer
): Promise<DownloadStatus> {
  const downloadMeta = new DownloadMeta(
    artifact.url,
    container.getLibraryPath(artifact.path),
    artifact.sha1
  );
  return await wrappedDownloadFile(downloadMeta);
}
