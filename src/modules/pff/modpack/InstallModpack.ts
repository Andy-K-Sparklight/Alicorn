import { zip } from "compressing";
import fs, { copy, readJSON } from "fs-extra";
import path from "path";
import { tr } from "../../../renderer/Translator";
import { basicHash } from "../../commons/BasicHash";
import { Pair } from "../../commons/Collections";
import { isFileExist } from "../../commons/FileUtil";
import { isNull, safeGet } from "../../commons/Null";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { addDoing } from "../../download/DownloadWrapper";
import { getDefaultJavaHome, getJavaRunnable } from "../../java/JInfo";
import { ProfileType } from "../../profile/WhatProfile";
import {
  getFabricInstaller,
  getLatestFabricInstallerAndLoader,
  removeFabricInstaller,
} from "../get/FabricGet";
import {
  generateForgeInstallerName,
  getForgeInstaller,
  getMojangByForge,
  removeForgeInstaller,
} from "../get/ForgeGet";
import { downloadProfile, getProfileURLById } from "../get/MojangCore";
import { performFabricInstall } from "../install/FabricInstall";
import { performForgeInstall } from "../install/ForgeInstall";
import { fetchSelectedMod, setPffFlag } from "../virtual/PffWrapper";
import {
  AbstractModResolver,
  CurseforgeModResolver,
  ModrinthModResolver,
} from "../virtual/Resolver";
import { ModpackModel, SimpleFile, transformManifest5 } from "./CFModpackModel";
import {
  CommonModpackModel,
  deployAllGameProfiles,
  deployAllModLoaders,
  generateBaseVersion,
  generateDefaultModLoader,
  OverrideFile,
} from "./CommonModpackModel";
export const MANIFEST_FILE = "manifest.json";
export const PACK_META = "mcbbs.packmeta";
async function parseModpack(
  container: MinecraftContainer,
  source: string
): Promise<Pair<"CF" | "CM", ModpackModel | CommonModpackModel | null>> {
  const sourceHash = basicHash(path.basename(source));
  const baseDir = container.getTempFileStorePath(path.join(sourceHash));
  try {
    await zip.uncompress(source, baseDir);
  } catch (e) {
    console.log(e);
    return new Pair("CF", null);
  }
  const mf = path.join(baseDir, MANIFEST_FILE);
  const mp = path.join(baseDir, PACK_META);
  let f;
  let type;
  if (await isFileExist(mp)) {
    f = await readJSON(mp);
    type = "CM";
  } else if (await isFileExist(mf)) {
    f = await readJSON(mf);
    type = "CF";
  } else {
    throw "Unsupported modpack!";
  }
  try {
    if (type == "CM") {
      f["overrideSourceDir"] = path.join(baseDir, OVERRIDE_CONTENT);
      return new Pair("CM", f as CommonModpackModel);
    }
    if (type === "CF") {
      return new Pair("CF", transformManifest5(f, baseDir));
    }
    throw "Unsupported manifest version: " + safeGet(f, ["manifestVersion"]);
  } catch (e) {
    console.log(e);
    return new Pair("CF", null);
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
    await fs.ensureDir(path.dirname(target));
    await copy(overridesRoot, target);
  } catch {}
}

export const OVERRIDE_CONTENT = "overrides";

async function deployFileOverrides(
  o: (OverrideFile | SimpleFile)[],
  unpackRoot: string,
  container: MinecraftContainer
): Promise<void> {
  await Promise.allSettled(
    o.map(async (f) => {
      // @ts-ignore
      if (!f["projectID"]) {
        f = f as OverrideFile;
        const target = container.resolvePath(f.path);
        await fs.ensureDir(path.dirname(target));
        await fs.copyFile(path.join(unpackRoot, f.path), target);
      }
    })
  );
}

export async function deployProfile(
  bv: string,
  container: MinecraftContainer
): Promise<void> {
  // Null safe
  if (bv.trim().length === 0) {
    return;
  }
  const u = await getProfileURLById(bv);
  if (u.length > 0) {
    await downloadProfile(u, container, bv);
  }
}

export async function deployModLoader(
  type: ProfileType,
  version: string,
  container: MinecraftContainer,
  mcVersions: string[] = [] // Optinal, Fabric only, since it doesn't rely on version
): Promise<void> {
  switch (type) {
    case ProfileType.FORGE: {
      const mcVersion = await getMojangByForge(version);
      if (!(await getForgeInstaller(container, mcVersion, version))) {
        await removeForgeInstaller(container, mcVersion, version); // Mostly this file does not exist
        throw "Could not fetch installer: No such installer!";
      }
      if (
        !(await performForgeInstall(
          await getJavaRunnable(getDefaultJavaHome()),
          generateForgeInstallerName(mcVersion, version),
          container
        ))
      ) {
        await removeForgeInstaller(container, mcVersion, version);
        throw "Could not perform install!";
      }
      await removeForgeInstaller(container, mcVersion, version);
      break;
    }
    case ProfileType.FABRIC:
    default: {
      const u = (await getLatestFabricInstallerAndLoader()).getFirstValue();
      if (isNull(u)) {
        throw "Could not fetch installer: No such installer!";
      }
      if (!(await getFabricInstaller(u, container))) {
        await removeFabricInstaller(u, container);
        throw "Failed to fetch installer!";
      }
      const jr = await getJavaRunnable(getDefaultJavaHome());
      await Promise.allSettled(
        mcVersions.map((mcVersion) => {
          return (async () => {
            if (
              !(await performFabricInstall(
                jr,
                u,
                version,
                mcVersion,
                container
              ))
            ) {
              await removeFabricInstaller(u, container);
              throw "Could not perform install!";
            }
            await removeFabricInstaller(u, container);
          })();
        })
      );
    }
  }
}
async function installMods(
  container: MinecraftContainer,
  model: ModpackModel | CommonModpackModel
): Promise<void> {
  setPffFlag("1");
  await Promise.all(
    model.files.map((m) => {
      // We only deal with CurseForge and Modrinth Mods as specified
      // @ts-ignore
      if (m["projectID"]) {
        m = m as SimpleFile;
        return installSingleMod(
          m.projectID,
          m.fileID,
          container,
          generateBaseVersion(model),
          generateDefaultModLoader(model) === "Forge" ? "Forge" : "Fabric" // Considering most modpacks uses Forge, this is for our USERS, not for such FORGE!
        );
      }
    })
  );
  setPffFlag("0");
}

async function installSingleMod(
  aid: string | number,
  fid: string | number,
  container: MinecraftContainer,
  gameVersion: string,
  modLoader: "Fabric" | "Forge"
): Promise<void> {
  let mr: AbstractModResolver;
  if (typeof aid === "number" || typeof fid === "number") {
    aid = aid.toString();
    fid = fid.toString();
    mr = new CurseforgeModResolver("");
  } else {
    mr = new ModrinthModResolver("");
  }
  await mr.setSelected(aid, fid);
  await mr.resolveMod();
  await fetchSelectedMod(mr, gameVersion, modLoader, container);
}

export async function wrappedInstallModpack(
  container: MinecraftContainer,
  source: string
): Promise<void> {
  addDoing(tr("ContainerManager.ParsingModpack"));
  const o = await parseModpack(container, source);
  let model = o.getSecondValue();
  if (!model) {
    throw "Could not parse this modpack!";
  }
  addDoing(tr("ContainerManager.DeployingProfile"));
  switch (o.getFirstValue()) {
    case "CM":
      {
        model = model as CommonModpackModel;
        await deployAllGameProfiles(model, container);
        addDoing(tr("ContainerManager.DeployingModLoader"));
        await deployAllModLoaders(model, container);
        addDoing(tr("ContainerManager.DeployingMods"));
        await installMods(container, model);
        addDoing(tr("ContainerManager.DeployingDeltas"));
        await deployFileOverrides(
          model.files,
          model.overrideSourceDir,
          container
        );
        addDoing(tr("ContainerManager.CleaningUp"));
        await removeTempFiles(container, source);
      }
      break;
    case "CF":
    default:
      model = model as ModpackModel;
      await deployProfile(model.baseVersion, container);
      if (model.modLoaders.length > 0) {
        addDoing(tr("ContainerManager.DeployingModLoader"));
        await deployModLoader(
          model.modLoaders[0].type || ProfileType.FORGE,
          model.modLoaders[0].version || "",
          container
        );
      }
      addDoing(tr("ContainerManager.DeployingMods"));
      await installMods(container, model);
      addDoing(tr("ContainerManager.DeployingDeltas"));
      await deployOverrides(model.overrideSourceDir, container.rootDir);
      addDoing(tr("ContainerManager.CleaningUp"));
      await removeTempFiles(container, source);
    // TODO
  }
}
