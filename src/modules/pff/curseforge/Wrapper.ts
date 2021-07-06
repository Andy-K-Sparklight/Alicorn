import {
  AddonInfo,
  getAddonInfoBySlug,
  getLatestFileByVersion,
  lookupAddonInfo,
  lookupFileInfo,
  requireFile,
} from "./Get";
import { getNumber, getString } from "../../config/ConfigSupport";
import { CF_API_BASE_URL, NULL_OUTPUT, PFF_MSG_GATE } from "./Values";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DATA_ROOT } from "../../config/DataSupport";
import { loadLockFile, saveLockFile, writeToLockFile } from "./Lockfile";
import { upgradeFile } from "./Upgrade";

export async function requireMod(
  slug: string | number,
  gameVersion: string,
  container: MinecraftContainer,
  emitter = NULL_OUTPUT
): Promise<boolean> {
  emitter.emit(PFF_MSG_GATE, `Loading lockfile from ${container.id}`);
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const pageSize = getNumber("pff.page-size", 10) || 10;
  const cacheRoot = getString("pff.cache-root", DATA_ROOT);
  const timeout = getNumber("download.concurrent.timeout");
  let aInfo: AddonInfo | undefined;
  emitter.emit(PFF_MSG_GATE, `Querying info for '${slug}'`);
  if (typeof slug === "string") {
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
    emitter.emit(PFF_MSG_GATE, "No such addon, stopped.");
    return false;
  }
  const latestFileId = getLatestFileByVersion(aInfo, gameVersion, false);
  if (latestFileId === 0) {
    emitter.emit(
      PFF_MSG_GATE,
      `This addon might not be compatible with version ${gameVersion}`
    );
  }
  emitter.emit(PFF_MSG_GATE, `Looking up file ${latestFileId}`);
  const latestFile = await lookupFileInfo(
    aInfo,
    latestFileId,
    apiBase,
    timeout
  );
  if (latestFile === undefined) {
    emitter.emit(
      PFF_MSG_GATE,
      `Failed to look up file, this file might not exist.`
    );
    return false;
  }
  emitter.emit(
    PFF_MSG_GATE,
    `All is well till now, start downloading from ${latestFile.downloadUrl}, this may take long long long long a time since CurseForge CDN isn't always so fast...`
  );
  const st = await requireFile(latestFile, aInfo, cacheRoot, container);
  if (st) {
    emitter.emit(PFF_MSG_GATE, "A few more things, writing lockfile...");
    await writeToLockFile(aInfo, latestFile, lockfile, gameVersion);
    await saveLockFile(lockfile, container);
    emitter.emit(PFF_MSG_GATE, "All done! Have fun!");
    return true;
  } else {
    emitter.emit(
      PFF_MSG_GATE,
      `Could not download file, try again or download it yourself: ${latestFile.downloadUrl}`
    );
    return false;
  }
}

export async function upgrade(container: MinecraftContainer): Promise<void> {
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cacheRoot = getString("pff.cache-root", DATA_ROOT);
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
