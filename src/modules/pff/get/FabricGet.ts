import fs from "fs-extra";
import { basicHash } from "../../commons/BasicHash";
import { Pair } from "../../commons/Collections";
import { FABRIC_META_ROOT } from "../../commons/Constants";
import { isNull, safeGet } from "../../commons/Null";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DownloadMeta } from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { xgot } from "../../download/GotWrapper";
import { JAR_SUFFIX } from "../../launch/NativesLint";

// Alicorn LIKE Fabric!
// Good Fabric! Noble Fabric! Excellent Fabric!

const FABRIC_VERSIONS_ROOT = FABRIC_META_ROOT + "/versions";

const FABRIC_VERSIONS_GAME = FABRIC_VERSIONS_ROOT + "/game";
export const FABRIC_VERSIONS_LOADER = FABRIC_VERSIONS_ROOT + "/loader";
const FABRIC_VERSIONS_INSTALLER = FABRIC_VERSIONS_ROOT + "/installer";

const FABRIC_INSTALLER_MANIFEST_CACHE_KEY = "FabricInstallerManifestCache";
const FABRIC_LOADER_MANIFEST_CACHE_KEY = "FabricLoaderManifestCache";

export async function getLatestFabricInstallerAndLoader(
  filter = FabricFilter.STABLE
): Promise<Pair<string, string>> {
  return (
    (await _getLatestFabricInstallerAndLoader(filter, false)) ||
    (await _getLatestFabricInstallerAndLoader(filter, true))
  );
}

export async function prefetchFabricManifest(): Promise<void> {
  await _getLatestFabricInstallerAndLoader(FabricFilter.STABLE, false, true);
}

// Get Fabric installer and loader
// Please notice that Fabric doesn't care about mojang version!
async function _getLatestFabricInstallerAndLoader(
  filter = FabricFilter.STABLE,
  noMirror = false,
  noTimeout = false
): Promise<Pair<string, string>> {
  let installerURL = "";
  let loaderVersion = "";
  try {
    let jInstaller;

    if (
      // @ts-ignore
      window[FABRIC_INSTALLER_MANIFEST_CACHE_KEY] !== undefined &&
      // @ts-ignore
      Object.keys(window[FABRIC_INSTALLER_MANIFEST_CACHE_KEY].length > 0)
    ) {
      // @ts-ignore
      jInstaller = window[FABRIC_INSTALLER_MANIFEST_CACHE_KEY];
    } else {
      jInstaller = await xgot(
        FABRIC_VERSIONS_INSTALLER,
        noMirror,
        false,
        noTimeout
      );

      // @ts-ignore
      window[FABRIC_INSTALLER_MANIFEST_CACHE_KEY] = jInstaller;
    }
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
    let jLoader;

    if (
      // @ts-ignore
      window[FABRIC_LOADER_MANIFEST_CACHE_KEY] !== undefined &&
      // @ts-ignore
      Object.keys(window[FABRIC_LOADER_MANIFEST_CACHE_KEY].length > 0)
    ) {
      // @ts-ignore
      jLoader = window[FABRIC_LOADER_MANIFEST_CACHE_KEY];
    } else {
      jLoader = await xgot(FABRIC_VERSIONS_LOADER, noMirror, false, noTimeout);

      // @ts-ignore
      window[FABRIC_LOADER_MANIFEST_CACHE_KEY] = jLoader;
    }

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
        generateFabricJarName(basicHash(url).slice(0, 8))
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
        generateFabricJarName(basicHash(url).slice(0, 8))
      ),
      ""
    );

    return (await wrappedDownloadFile(meta, true)) === 1;
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
