import fs from "fs-extra";
import { isNull } from "../commons/Null";
import { getBoolean } from "../config/ConfigSupport";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { isSharedContainer } from "../container/SharedFiles";
import { DownloadMeta, DownloadStatus } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import { GameProfile } from "../profile/GameProfile";
import { ArtifactMeta, AssetIndexFileMeta, AssetMeta } from "../profile/Meta";
import { FileOperateReport, LaunchTracker } from "./LaunchTracker";
import { checkExtractTrimNativeLocal, getNativeArtifact } from "./NativesLint";

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
            void checkExtractTrimNativeLocal(container, s).then(() => {
              resolve();
            });
          })
        );
      }
      return allPromises;
    })()
  );
}

// Ensure Client
// This function will do nothing if there isn't a valid client
export async function ensureClient(profile: GameProfile): Promise<void> {
  const ca = profile.clientArtifact;
  if (ca.url) {
    await wrappedDownloadFile(
      new DownloadMeta(ca.url, ca.path, ca.sha1, ca.size),
      true
    );
  }
}

// Ensure libraries
// The return value is the number of failed tasks
export async function ensureLibraries(
  profile: GameProfile,
  container: MinecraftContainer,
  tracker?: LaunchTracker
): Promise<number> {
  const tFiles: FileOperateReport = {
    total: 0,
    operateRecord: [],
    resolved: 0,
  };
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
  tFiles.total = allLibrariesToCheck.length;
  const values = await Promise.all(
    allLibrariesToCheck.map((artifact) => {
      return performSingleCheck(artifact, container, tFiles);
    })
  );
  let failedCount = 0;
  for (const x of values) {
    if (x !== 1) {
      failedCount++;
    }
  }
  tFiles.resolved = tFiles.total - failedCount;
  tracker?.library(tFiles);
  return failedCount;
}

// Check one library
// Downloader will check if file already exists
// So, we, don't, care!
async function performSingleCheck(
  artifact: ArtifactMeta,
  container: MinecraftContainer,
  operate?: FileOperateReport
): Promise<DownloadStatus> {
  const containerIsShared = await isSharedContainer(container);
  const downloadMeta = new DownloadMeta(
    artifact.url,
    container.getLibraryPath(artifact.path),
    artifact.sha1,
    artifact.size
  );
  const t = await wrappedDownloadFile(downloadMeta, !containerIsShared);
  if (t === 1) {
    operate?.operateRecord.push({
      file: artifact.path,
      operation: "OPERATED",
    });
  } else {
    operate?.operateRecord.push({
      file: artifact.path,
      operation: "FAILED",
    });
  }
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
    profile.assetIndex.sha1,
    profile.assetIndex.size
  );
  const containerIsShared = await isSharedContainer(container);
  return (await wrappedDownloadFile(meta, !containerIsShared)) === 1;
}

// Ensure all assets of a profile
// Call this AFTER 'ensureAssetsIndex'! This function are NOT automatically called!
export async function ensureAllAssets(
  profile: GameProfile,
  container: MinecraftContainer,
  tracker?: LaunchTracker
): Promise<number> {
  try {
    const containerIsShared = await isSharedContainer(container);
    const tFile: FileOperateReport = {
      total: 0,
      resolved: 0,
      operateRecord: [],
    };
    const obj = await fs.readJSON(
      container.getAssetsIndexPath(profile.assetIndex.id)
    );
    const il = profile.assetIndex.id.toLowerCase() === "legacy";
    const assetIndexFileMeta = AssetIndexFileMeta.fromObject(obj, il);
    const allObjects = assetIndexFileMeta.objects.concat();
    tFile.total = allObjects.length;
    const allStatus = await Promise.all(
      allObjects.map((o) => {
        return new Promise<boolean>((resolve) => {
          void ensureAsset(o, container, il, containerIsShared).then((b) => {
            if (b) {
              tFile.operateRecord.push({
                file: o.hash,
                operation: "OPERATED",
              });
            } else {
              tFile.operateRecord.push({
                file: o.hash,
                operation: "FAILED",
              });
            }
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
    tFile.resolved = tFile.total - failedCount;
    tracker?.assets(tFile);
    return failedCount;
  } catch {
    return -1; // Which means operation failed
  }
}

// Ensure one asset
// Since there are loads of objects, always call this function concurrently!
async function ensureAsset(
  assetMeta: AssetMeta,
  container: MinecraftContainer,
  isLegacy: boolean,
  containerShared: boolean
): Promise<boolean> {
  const meta = new DownloadMeta(
    generateAssetURL(assetMeta),
    isLegacy
      ? container.getAssetPathLegacy(assetMeta.path)
      : container.getAssetPath(assetMeta.hash),
    assetMeta.hash,
    assetMeta.size
  );
  return (await wrappedDownloadFile(meta, !containerShared)) === 1;
}

function generateAssetURL(assetMeta: AssetMeta): string {
  return ASSET_WEB_ROOT + assetMeta.hash.slice(0, 2) + "/" + assetMeta.hash;
}

export async function ensureLog4jFile(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<boolean> {
  if (getBoolean("cmc.disable-log4j-config")) {
    return true; // There is no need to download it
  }
  try {
    if (isNull(profile.logFile)) {
      return true;
    }
    const log4jPath = container.getLog4j2FilePath(profile.logFile.path);
    const dMeta = new DownloadMeta(
      profile.logFile.url,
      log4jPath,
      profile.logFile.sha1,
      profile.logFile.size
    );
    await wrappedDownloadFile(dMeta);
    return true;
  } catch {
    return false;
  }
}
