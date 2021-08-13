import { zip } from "compressing";
import fs, { copy, readJSON } from "fs-extra";
import path from "path";
import { tr } from "../../../renderer/Translator";
import { basicHash } from "../../commons/BasicHash";
import { isNull } from "../../commons/Null";
import { getNumber, getString } from "../../config/ConfigSupport";
import { DATA_ROOT } from "../../config/DataSupport";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { addDoing } from "../../download/DownloadWrapper";
import { getJavaRunnable, getLastUsedJavaHome } from "../../java/JInfo";
import { ProfileType } from "../../profile/WhatProfile";
import {
  lookupAddonInfo,
  lookupFileInfo,
  requireFile,
} from "../curseforge/Get";
import {
  loadLockFile,
  Lockfile,
  saveLockFile,
  writeToLockFile,
} from "../curseforge/Lockfile";
import { CF_API_BASE_URL } from "../curseforge/Values";
import {
  getFabricInstaller,
  getLatestFabricInstallerAndLoader,
  removeFabricInstaller,
} from "../get/FabricGet";
import {
  generateForgeInstallerName,
  getForgeInstaller,
  removeForgeInstaller,
} from "../get/ForgeGet";
import { getProfile, getProfileURLById } from "../get/MojangCore";
import { performFabricInstall } from "../install/FabricInstall";
import { performForgeInstall } from "../install/ForgeInstall";
import { installProfile } from "../install/MojangInstall";
import { ModpackModel, transformManifest5 } from "./ModpackModel";
const MANIFEST_FILE = "manifest.json";

async function parseModpack(
  container: MinecraftContainer,
  source: string
): Promise<ModpackModel | null> {
  const sourceHash = basicHash(path.basename(source));
  const baseDir = container.getTempFileStorePath(path.join(sourceHash));
  try {
    await zip.uncompress(source, baseDir);
  } catch (e) {
    console.log(e);
    return null;
  }
  const mf = path.join(baseDir, MANIFEST_FILE);
  try {
    const f = await readJSON(mf);
    return transformManifest5(f, baseDir);
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function removeTempFiles(
  container: MinecraftContainer,
  source: string
): Promise<void> {
  try {
    await fs.remove(
      container.getTempFileStorePath(basicHash(path.basename(source)))
    );
  } catch {}
}

async function deployOverrides(
  overridesRoot: string,
  target: string
): Promise<void> {
  try {
    await copy(overridesRoot, target);
  } catch {}
}

async function deployProfile(
  bv: string,
  container: MinecraftContainer
): Promise<void> {
  const u = await getProfileURLById(bv);
  if (u.length > 0) {
    const p = await getProfile(u);
    installProfile(bv, p, container);
  }
}

async function deployModLoader(
  type: ProfileType,
  version: string,
  mcVersion: string,
  container: MinecraftContainer
): Promise<void> {
  switch (type) {
    case ProfileType.FORGE:
      if (!(await getForgeInstaller(container, mcVersion, version))) {
        throw "Could not fetch installer: No such installer!";
      }
      if (
        !(await performForgeInstall(
          await getJavaRunnable(getLastUsedJavaHome()),
          generateForgeInstallerName(mcVersion, version),
          container
        ))
      ) {
        throw "Could not perform install!";
      }
      await removeForgeInstaller(container, mcVersion, version);
      break;
    case ProfileType.FABRIC:
    default: {
      const u = (await getLatestFabricInstallerAndLoader()).getFirstValue();
      if (isNull(u)) {
        throw "Could not fetch installer: No such installer!";
      }
      if (!(await getFabricInstaller(u, container))) {
        throw "Failed to fetch installer!";
      }
      if (
        !(await performFabricInstall(
          await getJavaRunnable(getLastUsedJavaHome()),
          u,
          version,
          mcVersion,
          container
        ))
      ) {
        throw "Could not perform install!";
      }
      await removeFabricInstaller(u, container);
    }
  }
}

async function installMods(
  container: MinecraftContainer,
  model: ModpackModel
): Promise<void> {
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cacheRoot = getString("pff.cache-root", DATA_ROOT, true);
  const timeout = getNumber("download.concurrent.timeout");
  await Promise.all(
    model.files.map((m) => {
      return installSingleMod(
        m.projectID,
        m.fileID,
        container,
        cacheRoot,
        apiBase,
        timeout,
        lockfile,
        model.baseVersion,
        profileType2Number(model.modLoaders[0].type || ProfileType.FORGE) // Considering most modepacks uses Forge, this is for our USERS, not for such FORGE!
      );
    })
  );
  await saveLockFile(lockfile, container);
}

async function installSingleMod(
  aid: number,
  fid: number,
  container: MinecraftContainer,
  cacheRoot: string,
  apiBase: string,
  timeout: number,
  lockfile: Lockfile,
  gameVersion: string,
  modLoader: number
): Promise<void> {
  addDoing(tr("PffFront.Query", `Slug=${aid}`));
  const addon = await lookupAddonInfo(aid, apiBase, timeout);
  if (!addon) {
    throw tr("PffFront.NoSuchAddon");
  }
  addDoing(tr("PffFront.LookingUpFile", `File=${fid}`));
  const file = await lookupFileInfo(addon, fid, apiBase, timeout);
  if (!file) {
    throw tr("PffFront.NoSuchFile");
  }
  addDoing(tr("PffFront.Downloading", `Url=${file.downloadUrl}`));
  if (await requireFile(file, addon, cacheRoot, container)) {
    writeToLockFile(addon, file, lockfile, gameVersion, modLoader);
  } else {
    throw tr("PffFront.Failed", `Url=${file.downloadUrl}`);
  }
}

function profileType2Number(pType: ProfileType): number {
  switch (pType) {
    case ProfileType.FORGE:
      return 1;
    case ProfileType.FABRIC:
    default:
      return 4;
  }
}

export async function wrappedInstallModpack(
  container: MinecraftContainer,
  source: string
): Promise<void> {
  const model = await parseModpack(container, source);
  if (!model) {
    throw "Could not parse this modpack!";
  }
  await deployProfile(model.baseVersion, container);
  if (model.modLoaders.length > 0) {
    await deployModLoader(
      model.modLoaders[0].type || ProfileType.FORGE,
      model.modLoaders[0].version || "",
      model.baseVersion,
      container
    );
  }
  await installMods(container, model);
  await deployOverrides(model.overrideSourceDir, container.rootDir);
  await removeTempFiles(container, source);
}
