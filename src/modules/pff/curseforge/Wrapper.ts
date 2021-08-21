import { tr } from "../../../renderer/Translator";
import { getNumber, getString } from "../../config/ConfigSupport";
import { DATA_ROOT } from "../../config/DataSupport";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import {
  AddonInfo,
  getAddonInfoBySlug,
  getLatestFileByVersion,
  lookupAddonInfo,
  lookupFileInfo,
  requireFile,
} from "./Get";
import { loadLockFile, saveLockFile, writeToLockFile } from "./Lockfile";
import { upgradeFile } from "./Upgrade";
import { CF_API_BASE_URL, NULL_OUTPUT, PFF_MSG_GATE } from "./Values";

export async function requireMod(
  slug: string | number,
  gameVersion: string,
  container: MinecraftContainer,
  emitter = NULL_OUTPUT,
  modLoader: number
): Promise<boolean> {
  emitter.emit(PFF_MSG_GATE, tr("PffFront.LoadingLock"));
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const pageSize = getNumber("pff.page-size", 10) || 10;
  const cacheRoot = getString("pff.cache-root", "");
  const timeout = getNumber("download.concurrent.timeout");
  let aInfo: AddonInfo | undefined;
  emitter.emit(PFF_MSG_GATE, tr("PffFront.Query", `Slug=${slug}`));
  if (typeof slug === "string") {
    slug = encodeURI(slug.toLowerCase());
    aInfo = await getAddonInfoBySlug(
      slug,
      apiBase,
      "",
      pageSize,
      false,
      timeout
    );
  } else {
    aInfo = await lookupAddonInfo(slug, apiBase, timeout);
  }
  if (aInfo === undefined) {
    emitter.emit(PFF_MSG_GATE, tr("PffFront.NoSuchAddon"));
    return false;
  }
  const latestFileId = getLatestFileByVersion(
    aInfo,
    gameVersion,
    false,
    modLoader
  );
  if (latestFileId === 0) {
    emitter.emit(
      PFF_MSG_GATE,
      tr("PffFront.NotCompatible", `Version=${gameVersion}`)
    );
    return false;
  }
  emitter.emit(
    PFF_MSG_GATE,
    tr("PffFront.LookingUpFile", `File=${latestFileId}`)
  );
  const latestFile = await lookupFileInfo(
    aInfo,
    latestFileId,
    apiBase,
    timeout
  );
  if (latestFile === undefined) {
    emitter.emit(PFF_MSG_GATE, tr("PffFront.NoSuchFile"));
    return false;
  }
  emitter.emit(
    PFF_MSG_GATE,
    tr("PffFront.Downloading", `Url=${latestFile.downloadUrl}`)
  );
  const st = await requireFile(latestFile, aInfo, cacheRoot, container);
  if (st) {
    emitter.emit(PFF_MSG_GATE, tr("PffFront.Locking"));
    writeToLockFile(aInfo, latestFile, lockfile, gameVersion, modLoader);
    await saveLockFile(lockfile, container);
    emitter.emit(PFF_MSG_GATE, tr("PffFront.Done"));
    return true;
  } else {
    emitter.emit(
      PFF_MSG_GATE,
      tr("PffFront.Failed", `Url=${latestFile.downloadUrl}`)
    );
    return false;
  }
}

export async function upgrade(container: MinecraftContainer): Promise<void> {
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cacheRoot = getString("pff.cache-root", "");
  const timeout = getNumber("download.concurrent.timeout");
  await upgradeFile(lockfile, apiBase, timeout, cacheRoot, container);
  await saveLockFile(lockfile, container);
}

const PFF_FLAG = "Downloader.IsPff";
// Since args pop is very hard for downloaders
// We will use a flag to do this
// 1 - Use pff config
// Any other value - Use common config
export function setPffFlag(value: string): void {
  window.sessionStorage.setItem(PFF_FLAG, value);
}
