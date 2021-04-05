import { applyMirror } from "../../download/Mirror";
import {
  FORGE_MAVEN_ROOT,
  FORGE_VERSIONS_MANIFEST,
} from "../../commons/Constants";
import { isNull, safeGet } from "../../commons/Null";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import {
  DownloadMeta,
  DownloadStatus,
} from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import fs from "fs-extra";
import { JAR_SUFFIX } from "../../launch/NativesLint";
import { xgot } from "../../download/GotWrapper";

// Forge Getter

const FORGE_WEB_ROOT = "/net/minecraftforge/forge";

const SUFFIX = "installer" + JAR_SUFFIX;

export async function getForgeVersionByMojang(
  id: string,
  filter = ForgeFilter.RECOMMENDED
): Promise<string> {
  try {
    const tBody = await xgot(FORGE_VERSIONS_MANIFEST);
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
    return (await wrappedDownloadFile(meta)) !== DownloadStatus.FAILED;
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
