import { FABRIC_META_ROOT } from "../../commons/Constants";
import { isNull, safeGet } from "../../commons/Null";
import { Pair } from "../../commons/Collections";
import { JAR_SUFFIX } from "../../launch/NativesLint";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import {
  DownloadMeta,
  DownloadStatus,
} from "../../download/AbstractDownloader";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import objectHash from "object-hash";
import fs from "fs-extra";
import { xgot } from "../../download/GotWrapper";

// Alicorn LIKE Fabric!
// Good Fabric! Noble Fabric! Excellent Fabric!

const FABRIC_VERSIONS_ROOT = FABRIC_META_ROOT + "/versions";

const FABRIC_VERSIONS_GAME = FABRIC_VERSIONS_ROOT + "/game";
export const FABRIC_VERSIONS_LOADER = FABRIC_VERSIONS_ROOT + "/loader";
const FABRIC_VERSIONS_INSTALLER = FABRIC_VERSIONS_ROOT + "/installer";

// Get Fabric installer and loader
// Please notice that Fabric doesn't care about mojang version!
export async function getLatestFabricInstallerAndLoader(
  filter = FabricFilter.STABLE
): Promise<Pair<string, string>> {
  let installerURL = "";
  let loaderVersion = "";
  try {
    const jInstaller = await xgot(FABRIC_VERSIONS_INSTALLER, true);
    if (jInstaller instanceof Array) {
      for (const i of jInstaller) {
        const url = safeGet(i, ["url"], "");
        if (!isNull(url)) {
          if (
            filter === FabricFilter.ANY ||
            safeGet(i, ["stable"], false) === true
          ) {
            installerURL = String(url || "");
            break;
          }
        }
      }
    }
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    const jLoader = await xgot(FABRIC_VERSIONS_LOADER, true);

    if (jLoader instanceof Array) {
      for (const l of jLoader) {
        const version = safeGet(l, ["version"]);
        if (!isNull(version)) {
          if (
            filter === FabricFilter.ANY ||
            safeGet(l, ["stable"], false) === true
          ) {
            loaderVersion = String(version || "");
            break;
          }
        }
      }
    }
    // eslint-disable-next-line no-empty
  } catch {}

  return new Pair<string, string>(installerURL, loaderVersion);
}

export function generateFabricJarName(id: string): string {
  return `fabric-installer-${id}` + JAR_SUFFIX;
}

export async function removeFabricInstaller(
  url: string,
  container: MinecraftContainer
): Promise<void> {
  try {
    await fs.remove(
      container.getTempFileStorePath(
        generateFabricJarName(objectHash(url).slice(0, 8))
      )
    );
  } catch {
    return;
  }
}

export async function getFabricInstaller(
  url: string,
  container: MinecraftContainer
): Promise<boolean> {
  try {
    const meta = new DownloadMeta(
      url,
      container.getTempFileStorePath(
        generateFabricJarName(objectHash(url).slice(0, 8))
      ),
      ""
    );

    return (await wrappedDownloadFile(meta)) === DownloadStatus.RESOLVED;
  } catch {
    return false;
  }
}

export async function canSupportGame(
  version: string,
  filter: FabricFilter = FabricFilter.STABLE
): Promise<boolean> {
  try {
    const gJson = await xgot(FABRIC_VERSIONS_GAME, true);
    if (gJson instanceof Array) {
      for (const c of gJson) {
        if (safeGet(c, ["version"]) === version) {
          if (
            filter === FabricFilter.ANY ||
            safeGet(c, ["stable"], false) === true
          ) {
            return true;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

enum FabricFilter {
  STABLE,
  ANY,
}

export { FabricFilter };
