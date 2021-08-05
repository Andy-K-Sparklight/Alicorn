import { unlink } from "fs-extra";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import {
  AddonInfo,
  getLatestFileByVersion,
  lookupAddonInfo,
  lookupFileInfo,
  requireFile,
} from "./Get";
import { Lockfile, writeToLockFile } from "./Lockfile";

export async function upgradeFile(
  lockfile: Lockfile,
  apiBase: string,
  timeout: number,
  cacheRoot: string,
  container: MinecraftContainer
): Promise<void> {
  const ADDON_INFO_MAP: Map<number, AddonInfo> = new Map();
  await Promise.allSettled(
    Object.keys(lockfile.files).map((f) => {
      return (async () => {
        const addonId = lockfile.files[f].addonId;
        let addonInfo: AddonInfo | undefined = ADDON_INFO_MAP.get(addonId);
        if (!addonInfo) {
          addonInfo = await lookupAddonInfo(addonId, apiBase, timeout);
          if (addonInfo) {
            ADDON_INFO_MAP.set(addonId, addonInfo);
          } else {
            throw "";
          }
        }
        const file = await lookupFileInfo(
          addonInfo,
          getLatestFileByVersion(
            addonInfo,
            lockfile.files[f].gameVersion,
            true,
            lockfile.files[f].modLoader
          ),
          apiBase,
          timeout
        );
        if (file?.fileDate === lockfile.files[f].fileDate) {
          return;
        }
        if (file) {
          const st = await requireFile(file, addonInfo, cacheRoot, container);
          if (st) {
            if (file.fileName !== lockfile.files[f].fileName) {
              await unlink(container.getModJar(lockfile.files[f].fileName));
            }
            delete lockfile.files[f];
            writeToLockFile(
              addonInfo,
              file,
              lockfile,
              lockfile.files[f].gameVersion,
              lockfile.files[f].modLoader
            );
          }
        }
      })();
    })
  );
}
