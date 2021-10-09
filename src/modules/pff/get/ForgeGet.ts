import fs from "fs-extra";
import semver from "semver";
import {
  FORGE_MAVEN_ROOT,
  FORGE_VERSIONS_MANIFEST,
} from "../../commons/Constants";
import { isNull, safeGet } from "../../commons/Null";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DownloadMeta } from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { xgot } from "../../download/GotWrapper";
import { isWebFileExist } from "../../download/RainbowFetch";
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

export async function getMojangByForge(fgv: string): Promise<string> {
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
    const d = safeGet(tBody, ["promos"], {}) as Record<string, string>;
    if (isNull(d)) {
      return "";
    }
    return getMCVersionByForgeVersion(fgv, d);
  } catch {
    return "";
  }
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
function generateForgeWebJarPathWithBranch(mcv: string, fgv: string): string {
  return (
    FORGE_MAVEN_ROOT +
    FORGE_WEB_ROOT +
    `/${mcv}-${fgv}-${mcv}/${generateForgeInstallerNameOld(mcv, fgv)}`
  );
}
function generateForgeWebJarPathWithBranchNew(
  mcv: string,
  fgv: string
): string {
  return (
    FORGE_MAVEN_ROOT +
    FORGE_WEB_ROOT +
    `/${mcv}-${fgv}-new/${generateForgeInstallerNameNew(mcv, fgv)}`
  );
}

export function generateForgeInstallerName(mcv: string, fgv: string): string {
  return `forge-${mcv}-${fgv}-${SUFFIX}`;
}

export function generateForgeInstallerNameOld(
  mcv: string,
  fgv: string
): string {
  return `forge-${mcv}-${fgv}-${mcv}-${SUFFIX}`;
}

export function generateForgeInstallerNameNew(
  mcv: string,
  fgv: string
): string {
  return `forge-${mcv}-${fgv}-new-${SUFFIX}`;
}

// Download Forge installer to a temp path
export async function getForgeInstaller(
  container: MinecraftContainer,
  mcv: string,
  fgv: string
): Promise<boolean> {
  try {
    const pt1 = generateForgeWebJarPath(mcv, fgv);
    const pt2 = generateForgeWebJarPathWithBranch(mcv, fgv);
    const pt3 = generateForgeWebJarPathWithBranchNew(mcv, fgv);
    const dest = container.getTempFileStorePath(
      generateForgeInstallerName(mcv, fgv)
    );
    // No validating
    try {
      const pt = Promise.any([
        isWebFileExist(pt1),
        isWebFileExist(pt2),
        isWebFileExist(pt3),
      ]);
      if (typeof pt === "string") {
        return (
          (await wrappedDownloadFile(new DownloadMeta(pt, dest, ""))) === 1
        );
      }
      return false;
    } catch {
      return false;
    }
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

// You need to provide 'promos'
// Forge doesn't open their full versions list, but thanks to semver, we can infer it.
// I don't want to do this, but I have to!
// Forge only leads to harm!!!
export function getMCVersionByForgeVersion(
  fgv: string,
  promos: Record<string, string>
): string {
  const tVer = semver.coerce(fgv);
  if (!tVer) {
    return "";
  }
  // Trim promos key
  const o: Record<string, string> = {};
  Object.keys(promos).forEach((m) => {
    if (m.includes("latest")) {
      // Only fetch the latest
      o[String(semver.valid(semver.coerce(m)))] = promos[m];
    }
  });
  const k = Object.keys(o);
  k.reverse();
  let ll = "";
  for (const v of k) {
    // From high to low
    const cVer = semver.coerce(o[v]);
    if (cVer) {
      if (semver.gt(tVer, cVer)) {
        return ll; // Last one
      } else if (semver.eq(tVer, cVer)) {
        return v;
      }
    }
    ll = v;
  }
  return "";
}
