import {
  AddonInfo,
  getAddonInfoBySlug,
  getLatestFilesByVersion,
  lookupAddonInfo,
  lookupFileInfo,
  requireFile,
} from "./Get";
import { getNumber, getString } from "../../config/ConfigSupport";
import { CF_API_BASE_URL } from "./Values";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DATA_ROOT } from "../../config/DataSupport";
import { loadLockFile, saveLockFile, writeToLockFile } from "./Lockfile";

export async function requireMod(
  slug: string | number,
  gameVersion: string,
  container: MinecraftContainer
): Promise<boolean> {
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const pageSize = getNumber("pff.page-size", 10) || 10;
  const cacheRoot = getString("pff.cache-root", DATA_ROOT);
  const timeout = getNumber("download.concurrent.timeout");
  let aInfo: AddonInfo | undefined;
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
    return false;
  }
  const latestFile = await lookupFileInfo(
    aInfo,
    getLatestFilesByVersion(aInfo, gameVersion),
    apiBase,
    timeout
  );
  if (latestFile === undefined) {
    return false;
  }
  const st = await requireFile(latestFile, aInfo, cacheRoot, container);
  if (st) {
    await writeToLockFile(aInfo, latestFile, lockfile);
    await saveLockFile(lockfile, container);
    return true;
  } else {
    return false;
  }
}
