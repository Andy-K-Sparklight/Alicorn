import { GameProfile } from "../profile/GameProfile";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { ArtifactMeta } from "../profile/Meta";
import {
  extractNativeLocalAndTrim,
  getNativeArtifact,
} from "../lint/NativesLint";
import { DownloadMeta } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
// Ensure that native libraries(*.dll) exists
// This is only a try, no GUARANTEE
// DO perform this AFTER 'ensureLibraries'!
// This function DOES NOT check if file already exists, it only decompress
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

export async function ensureLibraries(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<void> {
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
  await Promise.all(
    (() => {
      return allLibrariesToCheck.map((artifact) => {
        return performSingleCheck(artifact, container);
      });
    })()
  );
}

async function performSingleCheck(
  artifact: ArtifactMeta,
  container: MinecraftContainer
): Promise<void> {
  const downloadMeta = new DownloadMeta(
    artifact.url,
    container.getLibraryPath(artifact.path),
    artifact.sha1
  );
  await wrappedDownloadFile(downloadMeta);
}
