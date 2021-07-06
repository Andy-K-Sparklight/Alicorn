/*
CLAIM FOR EXTERNAL RESOURCE

This modules (ForgeInstall.ts) uses HarmonyForgeInstallerCLI (forge.iw.jar), which is my work.
HarmonyForgeInstallerCLI is licensed under the GNU GENERAL PUBLIC LICENSE 3.0 (aka. GPL-3.0) and it's a free software (free as in freedom).
It's license is compatible with ours, since we use GPL-3.0 too.
For details, please see https://bitbucket.org/RarityEG/harmonyforgeinstallercli/src/main/LICENSE

A copy of forge.iw.jar will be saved to the root dir of alicorn data.
*/
import { getActualDataPath, saveDefaultData } from "../../config/DataSupport";
import { FILE_SEPARATOR } from "../../commons/Constants";
import { isFileExist, wrappedLoadJSON } from "../../commons/FileUtil";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { LibraryMeta } from "../../profile/Meta";
import { isNull, safeGet } from "../../commons/Null";
import { makeLibrary } from "../../profile/FabricProfileAdaptor";
import { GameProfile } from "../../profile/GameProfile";
import path from "path";
import { JAR_SUFFIX } from "../../launch/NativesLint";
import fs from "fs-extra";
import { zip } from "compressing";
import { Pair } from "../../commons/Collections";
import { noDuplicateConcat } from "../../profile/InheritedProfileAdaptor";
import childProcess from "child_process";
import { ensureLibraries } from "../../launch/Ensurance";

// MAINTAINERS ONLY

const FORGE_INSTALLER_HEADLESS = "forge.iw.jar";
const CP_ARG = "-cp";
const LAUNCHER_PROFILES = "launcher_profiles.json";
// Figured out! Java problem
// Okay we shall suggest 8 for 1.12.2 or earlier and 11 for 1.13 or later
// This runs well!
const PONY_KIND_MAIN_CLASS = "rarityeg.alicorn.ForgeInstallerWrapper";
const VERSION_PROFILE = "version.json";
const INSTALL_PROFILE = "install_profile.json";

// Save 'forge.iw.jar'
export async function initForgeInstallModule(): Promise<void> {
  await saveDefaultData(FORGE_INSTALLER_HEADLESS);
}

// Run this AFTER downloaded the installer!
// Argument forgeJar is a relative path generated with generateForgeInstallerName
export async function performForgeInstall(
  jExecutable: string,
  forgeJar: string,
  container: MinecraftContainer
): Promise<boolean> {
  console.log("Running Forge installer.");
  let failBit = true;
  try {
    await makeTempLP(container);
    const ret = await getPolyfillForgeProfile(forgeJar, container);
    // Stupid Forge
    // We have to fill libraries for the installer, it's slow...
    console.log("Ensuring libraries");
    await ensureLibraries(ret.getFirstValue(), container);
    await bootForgeInstaller(jExecutable, forgeJar, container);
    await fs.ensureDir(container.getModsRoot());
  } catch {
    failBit = false;
  }
  return failBit;
}

// Make sure that you call this function AFTER extracted the installer!
export async function bootForgeInstaller(
  jExecutable: string,
  forgeJar: string,
  container: MinecraftContainer
): Promise<void> {
  console.log("Starting Forge installer process");
  const fihPt = getActualDataPath(FORGE_INSTALLER_HEADLESS);
  const fgPt = container.getTempFileStorePath(forgeJar);
  const rcp = childProcess.spawn(
    jExecutable,
    [
      CP_ARG,
      fihPt + FILE_SEPARATOR + fgPt,
      PONY_KIND_MAIN_CLASS,
      container.resolvePath(""),
    ],
    { cwd: container.resolvePath() }
  );
  return new Promise<void>((resolve, reject) => {
    rcp.on("close", (code) => {
      if (code === 0) {
        resolve();
      }
      reject();
    });
    rcp.on("error", () => {
      rcp.kill("SIGKILL");
      // Forcefully
      reject();
    });
    rcp.stdout?.on("data", (d) => {
      console.log(d.toString());
    });
    rcp.stderr?.on("data", (d) => {
      console.log(d.toString());
    });
  });
}

// Gets the converted profile
// This is NOT bootable! Only for 'ensureLibraries'
export async function getPolyfillForgeProfile(
  forgeJar: string,
  container: MinecraftContainer
): Promise<Pair<GameProfile, boolean>> {
  const j2 = await getForgeInstallProfileAndVersionProfile(forgeJar, container);
  const ipf = j2.getFirstValue();
  const vf = j2.getSecondValue();
  let finalProfile: GameProfile;
  let modernBit: boolean;
  if (Object.getOwnPropertyNames(vf).length <= 0) {
    // Cannot use 'vf === {}'
    modernBit = false;
    finalProfile =
      generateForgeDownloadableLibrariesLegacyInProfileAsProfile(ipf);
  } else {
    modernBit = true;
    finalProfile = concatForgeProfiles(
      generateForgeDownloadableLibrariesModernAsProfile(ipf),
      generateForgeDownloadableLibrariesModernAsProfile(vf)
    );
  }
  await rmTempForgeFiles(forgeJar, container); // Remove after loaded
  return new Pair<GameProfile, boolean>(finalProfile, modernBit);
}

// Remove the extracted files
async function rmTempForgeFiles(
  forgeJar: string,
  container: MinecraftContainer
): Promise<void> {
  try {
    await fs.remove(
      container.getTempFileStorePath(path.basename(forgeJar, JAR_SUFFIX))
    );
  } catch {
    return;
  }
}

// Create a empty 'launcher_profile.json' for the silly installer
export async function makeTempLP(container: MinecraftContainer): Promise<void> {
  const originLP = container.resolvePath(LAUNCHER_PROFILES);
  if (!(await isFileExist(originLP))) {
    await fs.writeJSON(originLP, { profiles: {} });
  }
  /* try {
    await copyFileStream(
      container.resolvePath(LAUNCHER_PROFILES),
      container.resolvePath(LP_BACKUP)
    );
  } catch {
    return;
  } */
}

// For legacy profiles
// Such a long name! We better not to export it XD
function generateForgeDownloadableLibrariesLegacyInProfileAsProfile(
  obj: unknown
): GameProfile {
  try {
    const allLibraries = safeGet(obj, ["versionInfo", "libraries"], null);
    const gp = new GameProfile({});
    gp.libraries = [];
    if (allLibraries instanceof Array) {
      for (const l of allLibraries) {
        if (
          safeGet(l, ["clientreq"], null) === true &&
          !isNull(safeGet(l, ["checksums"]))
        ) {
          // This function comes from Fabric
          gp.libraries.push(LibraryMeta.fromObject(makeLibrary(l)));
        }
      }
    }
    return gp;
  } catch {
    return new GameProfile({});
  }
}

// Modern way
// Call this function for 'install_profile.json' and 'version.json'
// Both may be okay
function generateForgeDownloadableLibrariesModernAsProfile(
  obj: Record<string, unknown>
): GameProfile {
  // Simply use the parser before
  return new GameProfile(obj);
}

// Unzip the installer
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

// Wrap up those functions
// This will try to load 'install_profile.json' and 'version.json'(1.13 or later)
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

// Merge profiles
// This one doesn't work like makeInherit, this one only deal with libraries
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
