import { GameProfile } from "../profile/GameProfile";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { ArtifactMeta, AssetIndexFileMeta, AssetMeta } from "../profile/Meta";
import { checkExtractTrimNativeLocal, getNativeArtifact } from "./NativesLint";
import { DownloadMeta, DownloadStatus } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import fs from "fs-extra";
import { Progresser } from "../commons/Progresser";
import { isNull } from "../commons/Null";
// UNCHECKED
// This file can not only check resources, but also download packages when installing!

const ASSET_WEB_ROOT = "https://resources.download.minecraft.net/";

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
  container: MinecraftContainer,
  progresser?: Progresser
): Promise<void> {
  progresser?.setResolved("Collecting information...");
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
            checkExtractTrimNativeLocal(container, s).then(() => {
              progresser?.markUpdate("Resolved native library " + s.path);
              resolve();
            });
          })
        );
      }
      return allPromises;
    })()
  );
  progresser?.markEnd("All native libraries are resolved.");
}

// Ensure Client
// This function will do nothing if there isn't a valid client
export async function ensureClient(profile: GameProfile): Promise<void> {
  console.log("Ensuring client for " + profile.id);
  console.log(profile);
  if (isNull(profile.clientArtifact)) {
    return;
  }
  if (isNull(profile.clientArtifact.path)) {
    return;
  }
  console.log("Downloading!");
  console.log(
    new DownloadMeta(
      profile.clientArtifact.url,
      profile.clientArtifact.path,
      profile.clientArtifact.sha1
    )
  );
  await wrappedDownloadFile(
    new DownloadMeta(
      profile.clientArtifact.url,
      profile.clientArtifact.path,
      profile.clientArtifact.sha1
    )
  );
}

// Ensure libraries
// The return value is the number of failed tasks
export async function ensureLibraries(
  profile: GameProfile,
  container: MinecraftContainer,
  progresser?: Progresser
): Promise<number> {
  progresser?.setResolved("Collecting information...");
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
        return performSingleCheck(artifact, container, progresser);
      });
    })()
  );
  let failedCount = 0;
  for (const x of values) {
    if (x == DownloadStatus.FAILED) {
      failedCount++;
    }
  }
  progresser?.markEnd("All libraries are checked.");
  return failedCount;
}

// Check one library
// Downloader will check if file already exists
// So, we, don't, care!
async function performSingleCheck(
  artifact: ArtifactMeta,
  container: MinecraftContainer,
  progresser?: Progresser
): Promise<DownloadStatus> {
  const downloadMeta = new DownloadMeta(
    artifact.url,
    container.getLibraryPath(artifact.path),
    artifact.sha1
  );
  const t = await wrappedDownloadFile(downloadMeta);
  progresser?.markUpdate("Resolved library " + artifact.path);
  return t;
}

// Ensure assets index file
// True means resolved, false means failed
export async function ensureAssetsIndex(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<boolean> {
  const meta = new DownloadMeta(
    profile.assetIndex.url,
    container.getAssetsIndexPath(profile.assetIndex.id),
    profile.assetIndex.sha1
  );
  return (await wrappedDownloadFile(meta)) === DownloadStatus.RESOLVED;
}

// Ensure all assets of a profile
// Call this AFTER 'ensureAssetsIndex'! This function are NOT automatically called!
export async function ensureAllAssets(
  profile: GameProfile,
  container: MinecraftContainer,
  progresser?: Progresser
): Promise<number> {
  try {
    progresser?.setResolved("Collecting information...");
    const obj = await fs.readJSON(
      container.getAssetsIndexPath(profile.assetIndex.id)
    );
    const assetIndexFileMeta = AssetIndexFileMeta.fromObject(obj);
    const allObjects = assetIndexFileMeta.objects.concat();
    const allStatus = await Promise.all(
      allObjects.map((o) => {
        return new Promise<boolean>((resolve) => {
          ensureAsset(o, container).then((b) => {
            progresser?.markUpdate("Resolved asset " + o.hash);
            resolve(b);
          });
        });
      })
    );
    let failedCount = 0;
    for (const x of allStatus) {
      if (!x) {
        failedCount++;
      }
    }
    progresser?.markEnd("All assets are checked.");
    return failedCount;
  } catch {
    return -1; // Which means operation failed
  }
}

// Ensure one asset
// Since there are loads of objects, always call this function concurrently!
export async function ensureAsset(
  assetMeta: AssetMeta,
  container: MinecraftContainer
): Promise<boolean> {
  const meta = new DownloadMeta(
    generateAssetURL(assetMeta),
    container.getAssetPath(assetMeta.hash),
    assetMeta.hash
  );
  return (await wrappedDownloadFile(meta)) === DownloadStatus.RESOLVED;
}

export function generateAssetURL(assetMeta: AssetMeta): string {
  return ASSET_WEB_ROOT + assetMeta.hash.slice(0, 2) + "/" + assetMeta.hash;
}

export async function ensureLog4jFile(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<boolean> {
  try {
    if (isNull(profile.logFile)) {
      return true;
    }
    const log4jPath = container.getLog4j2FilePath(profile.logFile.path);
    const dMeta = new DownloadMeta(
      profile.logFile.url,
      log4jPath,
      profile.logFile.sha1
    );
    await wrappedDownloadFile(dMeta);
    return true;
  } catch {
    return false;
  }
}
