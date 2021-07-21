import fs from "fs-extra";
import {
  FORGE_MAVEN_ROOT,
  FORGE_VERSIONS_MANIFEST,
} from "../../commons/Constants";
import { isNull, safeGet } from "../../commons/Null";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DownloadMeta } from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { xgot } from "../../download/GotWrapper";
import { applyMirror } from "../../download/Mirror";
import { JAR_SUFFIX } from "../../launch/NativesLint";

// Forge Getter

const FORGE_WEB_ROOT = "/net/minecraftforge/forge";

const SUFFIX = "installer" + JAR_SUFFIX;

const FORGE_MANIFEST_CACHE_KEY = "ForgeManifestCache";

export async function getForgeVersionByMojang(
  id: string,
  filter = ForgeFilter.RECOMMENDED
): Promise<string> {
  return (
    (await _getForgeVersionByMojang(id, filter, false)) ||
    (await _getForgeVersionByMojang(id, filter, true, true))
  );
}

export async function prefetchForgeManifest(): Promise<void> {
  await _getForgeVersionByMojang("", ForgeFilter.RECOMMENDED, false, true);
}

async function _getForgeVersionByMojang(
  id: string,
  filter = ForgeFilter.RECOMMENDED,
  noMirror = false,
  noTimeout = false
): Promise<string> {
  try {
    let tBody;
    try {
      if (
        // @ts-ignore
        window[FORGE_MANIFEST_CACHE_KEY] !== undefined &&
        // @ts-ignore
        Object.keys(window[FORGE_MANIFEST_CACHE_KEY]).length > 0
      ) {
        // @ts-ignore
        tBody = window[FORGE_MANIFEST_CACHE_KEY];
      } else {
        // @ts-ignore
        tBody = await xgot(FORGE_VERSIONS_MANIFEST, noMirror, false, noTimeout);

        // @ts-ignore
        window[FORGE_MANIFEST_CACHE_KEY] = tBody;
      }
    } catch {
      // @ts-ignore
      tBody = await xgot(FORGE_VERSIONS_MANIFEST, noMirror, false, noTimeout);

      // @ts-ignore
      window[FORGE_MANIFEST_CACHE_KEY] = tBody;
    }
    const d = safeGet(tBody, ["promos", `${id}-${filter}`], "");
    if (isNull(d)) {
      if (filter === ForgeFilter.LATEST) {
        return "";
      }
      return String(
        safeGet(tBody, ["promos", `${id}-${ForgeFilter.LATEST}`], "") || ""
      );
    }
    return String(d || "");
  } catch {
    return "";
  }
}

enum ForgeFilter {
  LATEST = "latest",
  RECOMMENDED = "recommended",
}

export { ForgeFilter };

function generateForgeWebJarPath(mcv: string, fgv: string): string {
  return (
    FORGE_MAVEN_ROOT +
    FORGE_WEB_ROOT +
    `/${mcv}-${fgv}/${generateForgeInstallerName(mcv, fgv)}`
  );
}

export function generateForgeInstallerName(mcv: string, fgv: string): string {
  return `forge-${mcv}-${fgv}-${SUFFIX}`;
}

// Download Forge installer to a temp path
export async function getForgeInstaller(
  container: MinecraftContainer,
  mcv: string,
  fgv: string
): Promise<boolean> {
  try {
    const pt = generateForgeWebJarPath(mcv, fgv);
    const dest = container.getTempFileStorePath(
      generateForgeInstallerName(mcv, fgv)
    );
    // No validating
    const meta = new DownloadMeta(applyMirror(pt), dest, "");
    console.log(meta);
    return (await wrappedDownloadFile(meta, true)) === 1;
  } catch {
    return false;
  }
}

export async function removeForgeInstaller(
  container: MinecraftContainer,
  mcv: string,
  fgv: string
): Promise<void> {
  try {
    await fs.remove(
      container.getTempFileStorePath(generateForgeInstallerName(mcv, fgv))
    );
  } catch {
    return;
  }
}
