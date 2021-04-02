import { saveDefaultData } from "../../config/DataSupport";
import { ALICORN_DATA_SUFFIX } from "../../commons/Constants";
import { copyFileStream, wrappedLoadJSON } from "../../config/FileUtil";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { ArtifactMeta, LibraryMeta } from "../../profile/Meta";
import { isNull, safeGet } from "../../commons/Null";
import { makeLibrary } from "../../profile/FabricProfileAdaptor";
import { GameProfile } from "../../profile/GameProfile";
import path from "path";
import { JAR_SUFFIX } from "../../launch/NativesLint";
import fs from "fs-extra";
import { zip } from "compressing";
import { Pair } from "../../commons/Collections";
import { noDuplicateConcat } from "../../profile/InheritedProfileAdaptor";

const FORGE_INSTALLER_HEADLESS = "fih.jar";
const MODERN_FORGE_MAIN_CLASS = "me.xfl03.HeadlessInstaller";
const CP_ARG = "-cp";
const INSTALL_ARG = "-installClient";
const LAUNCHER_PROFILES = "launcher_profiles.json";
const LP_BACKUP = "lp.backup" + ALICORN_DATA_SUFFIX;
const LEGACY_FORGE_MAIN_CLASS = "net.minecraftforge.installer.SimpleInstaller";
const VERSION_PROFILE = "version.json";
const INSTALL_PROFILE = "install_profile.json";

export async function initForgeInstallModule(): Promise<void> {
  await saveDefaultData(FORGE_INSTALLER_HEADLESS);
}

// TODO run forge installer

export async function getPolyfillForgeProfile(
  forgeJar: string,
  container: MinecraftContainer
): Promise<GameProfile> {
  const j2 = await getForgeInstallProfileAndVersionProfile(forgeJar, container);
  const ipf = j2.getFirstValue();
  const vf = j2.getSecondValue();
  let finalProfile: GameProfile;
  if (Object.getOwnPropertyNames(vf).length <= 0) {
    // Cannot use 'vf === {}'
    finalProfile = generateForgeDownloadableLibrariesLegacyInProfileAsProfile(
      ipf
    );
  } else {
    finalProfile = concatForgeProfiles(
      generateForgeDownloadableLibrariesModernAsProfile(ipf),
      generateForgeDownloadableLibrariesModernAsProfile(vf)
    );
  }
  return finalProfile;
}

async function makeTempLP(container: MinecraftContainer): Promise<void> {
  try {
    await copyFileStream(
      container.resolvePath(LAUNCHER_PROFILES),
      container.resolvePath(LP_BACKUP)
    );
  } catch {
    return;
  }
}

async function restoreLP(container: MinecraftContainer): Promise<void> {
  try {
    await copyFileStream(
      container.resolvePath(LP_BACKUP),
      container.resolvePath(LAUNCHER_PROFILES)
    );
  } catch {
    return;
  }
}

export function generateForgeDownloadableLibrariesLegacyInProfileAsProfile(
  obj: unknown
): GameProfile {
  try {
    const allLibraries = safeGet(obj, ["versionInfo", "libraries"], null);
    const tAll: ArtifactMeta[] = [];
    const gp = new GameProfile({});
    gp.libraries = [];
    if (allLibraries instanceof Array) {
      for (const l of allLibraries) {
        if (
          safeGet(l, ["clientreq"], null) === true &&
          !isNull(safeGet(l, ["checksums"]))
        ) {
          gp.libraries.push(LibraryMeta.fromObject(makeLibrary(l)));
        }
      }
    }
    return gp;
  } catch {
    return new GameProfile({});
  }
}

// Call this function for 'install_profile.json' and 'version.json'
// Both may be okay
export function generateForgeDownloadableLibrariesModernAsProfile(
  obj: Record<string, unknown>
): GameProfile {
  // Simply use the parser before
  return new GameProfile(obj);
}

async function extractForgeFiles(
  forgeJar: string,
  container: MinecraftContainer
): Promise<void> {
  const targetDirName = container.getTempFileStorePath(
    path.basename(forgeJar, JAR_SUFFIX)
  );
  await fs.ensureDir(targetDirName);
  await zip.uncompress(container.getTempFileStorePath(forgeJar), targetDirName);
}

async function getForgeInstallProfileAndVersionProfile(
  forgeJar: string,
  container: MinecraftContainer
): Promise<Pair<Record<string, unknown>, Record<string, unknown>>> {
  await extractForgeFiles(forgeJar, container);
  const forgeDir = container.getTempFileStorePath(
    path.basename(forgeJar, JAR_SUFFIX)
  );
  const ipfPt = path.join(forgeDir, INSTALL_PROFILE);
  const vfPt = path.join(forgeDir, VERSION_PROFILE);
  const ipf: Record<string, unknown> = await wrappedLoadJSON(ipfPt, {});
  const vf: Record<string, unknown> = await wrappedLoadJSON(vfPt, {});
  return new Pair<Record<string, unknown>, Record<string, unknown>>(ipf, vf);
}

function concatForgeProfiles(
  base: GameProfile,
  ...profiles: GameProfile[]
): GameProfile {
  const bp = Object.assign({}, base);
  for (const p of profiles) {
    bp.libraries = noDuplicateConcat(bp.libraries, p.libraries);
  }
  return bp;
}
