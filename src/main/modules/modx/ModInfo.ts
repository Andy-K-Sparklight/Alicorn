import { getHash } from "../download/Validate";
import { getActualDataPath } from "../config/DataSupport";
import { ALICORN_DATA_SUFFIX } from "../commons/Constants";
import { getString } from "../config/ConfigSupport";
import os from "os";
import path from "path";
import { JAR_SUFFIX } from "../launch/NativesLint";
import { copyFileStream, isFileExist } from "../config/FileUtil";
import fs from "fs-extra";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { zip } from "compressing";
import { isNull, safeGet } from "../commons/Null";
import toml from "toml";

const MCMOD_INFO = "mcmod.info";
const FABRIC_MOD_JSON = "fabric.mod.json";
const MODS_TOML = "mods.toml";
const META_INF = "META-INF";

// It's VERY difficult to deal with mod names
// The name of some mods are really confusing
// We cache a mod's file as '<hash>.modx.jar' and its meta as '<hash>.modx.ald'
// And create a map to cache generated info
// Format: <modid>-<mcversion>-<version>
// This might solve most problem

const MOD_META_SUFFIX = ".modx" + ALICORN_DATA_SUFFIX;
const MOD_CACHE_SUFFIX = ".modx" + JAR_SUFFIX;
const MOD_INFO_ROOT_NAME = "modx";
const DEFAULT_DIR = getActualDataPath(MOD_INFO_ROOT_NAME);
let MOD_INFO_DIR: string;
let MOD_CACHE_DIR: string;
let MOD_META_DIR: string;

enum ModMetaHeaders {
  FORGE_LEGACY = "$FL!",
  FORGE_MODERN = "$FM!",
  FABRIC = "$FB!",
}

interface ModInfo {
  id?: string;
  displayName?: string;
  loader?: ModLoader;
  mcversion?: string;
  version?: string;
  authors?: string[];
  logo?: string;
  url?: string;
  fileName?: string;
  description?: string;
}

enum ModLoader {
  FORGE = "Forge",
  FABRIC = "Fabric",
  UNKNOWN = "Unknown",
}

export { ModLoader };

export function initModInfo(): void {
  MOD_INFO_DIR = getString("modx.default-save-path", "${DEFAULT}")
    .replace("${DEFAULT}", DEFAULT_DIR)
    .replace("${USER_HOME}", os.homedir());
  MOD_CACHE_DIR = path.join(MOD_INFO_DIR, "mods");
  MOD_META_DIR = path.join(MOD_INFO_DIR, "metas");
}

// Save that mod file
async function saveModFileWithHash(
  hash: string,
  origin: string
): Promise<void> {
  try {
    await copyFileStream(
      origin,
      path.join(MOD_CACHE_DIR, hash + MOD_CACHE_SUFFIX)
    );
  } catch {}
}

// Extract mod files
async function extractModFiles(
  modJar: string,
  container: MinecraftContainer
): Promise<boolean> {
  try {
    const jPath = container.getModJar(modJar);
    const dest = container.getTempFileStorePath(
      path.basename(modJar, JAR_SUFFIX)
    );
    await fs.emptydir(dest);
    await zip.uncompress(jPath, dest);
    return true;
  } catch {
    return false;
  }
}

async function deleteModFiles(
  modJar: string,
  container: MinecraftContainer
): Promise<void> {
  try {
    await fs.remove(
      container.getTempFileStorePath(path.basename(modJar, JAR_SUFFIX))
    );
  } catch {}
}

// Load mod info
// Large function!
export async function loadModInfo(
  modJar: string,
  container: MinecraftContainer
): Promise<ModInfo> {
  try {
    const hash = await getHash(container.getModJar(modJar));
    if (await hasCachedMeta(hash)) {
      const mt = await fs.readFile(
        path.join(MOD_META_DIR, hash + MOD_META_SUFFIX)
      );
      return await loadCachedMeta(mt.toString());
    }
    await extractModFiles(modJar, container);

    const fBase = container.getTempFileStorePath(
      path.basename(modJar, JAR_SUFFIX)
    );
    const ret: ModInfo = {};
    let tFile;
    ret.fileName = container.getModJar(modJar);
    if (await isFileExist(path.join(fBase, FABRIC_MOD_JSON))) {
      ret.loader = ModLoader.FABRIC;
      tFile = path.join(fBase, FABRIC_MOD_JSON);
      loadFabricInfo(await fs.readJSON(tFile), ret);
      await cacheMeta(hash, ModMetaHeaders.FABRIC, tFile);
      await deleteModFiles(modJar, container);
      await saveModFileWithHash(hash, ret.fileName);
      return ret;
    } else if (await isFileExist(path.join(fBase, META_INF, MODS_TOML))) {
      ret.loader = ModLoader.FORGE;
      tFile = path.join(fBase, META_INF, MODS_TOML);
      loadTomlInfo(toml.parse((await fs.readFile(tFile)).toString()), ret);
      await cacheMeta(hash, ModMetaHeaders.FORGE_MODERN, tFile);
      await deleteModFiles(modJar, container);
      await saveModFileWithHash(hash, ret.fileName);
      return ret;
    } else if (await isFileExist(path.join(fBase, MCMOD_INFO))) {
      ret.loader = ModLoader.FORGE;
      tFile = path.join(fBase, MCMOD_INFO);
      loadMCMODInfo(await fs.readJSON(tFile), ret);
      await cacheMeta(hash, ModMetaHeaders.FORGE_LEGACY, tFile);
      await deleteModFiles(modJar, container);
      await saveModFileWithHash(hash, ret.fileName);
      return ret;
    } else {
      // Bad loader
      await deleteModFiles(modJar, container);
      return {
        fileName: container.getModJar(modJar),
        loader: ModLoader.UNKNOWN,
      };
    }
  } catch {
    await deleteModFiles(modJar, container);
    return { fileName: container.getModJar(modJar) };
  }
}

async function hasCachedMeta(hash: string): Promise<boolean> {
  return await isFileExist(path.join(MOD_META_DIR, hash + MOD_META_SUFFIX));
}

async function cacheMeta(
  hash: string,
  header: ModMetaHeaders,
  origin: string
): Promise<void> {
  try {
    await fs.writeFile(
      path.join(MOD_META_DIR, hash + MOD_META_SUFFIX),
      header + (await fs.readFile(origin)).toString()
    );
  } catch {}
}

function loadCachedMeta(data: string): ModInfo {
  const body = data.slice(4);
  const head = data.slice(0, 4);
  const t: ModInfo = {};
  switch (head) {
    case ModMetaHeaders.FABRIC:
      loadFabricInfo(JSON.parse(body), t);
      return t;
    case ModMetaHeaders.FORGE_LEGACY:
      loadMCMODInfo(JSON.parse(body), t);
      return t;
    default:
    case ModMetaHeaders.FORGE_MODERN:
      loadTomlInfo(toml.parse(body), t);
      return t;
  }
}

function loadFabricInfo(obj: Record<string, unknown>, rawInfo: ModInfo): void {
  rawInfo.mcversion = "*";
  // Fabric does not contain a version key, we just ignore it
  rawInfo.id = String(safeGet(obj, ["id"]));
  rawInfo.version = String(safeGet(obj, ["version"]));
  rawInfo.description = String(safeGet(obj, ["description"]));
  rawInfo.displayName = String(safeGet(obj, ["name"]));
  const tAuthors = safeGet(obj, ["authors"], []);
  rawInfo.authors = tAuthors instanceof Array ? tAuthors : [];
  rawInfo.logo = String(safeGet(obj, ["icon"], ""));
  rawInfo.url = String(
    safeGet(obj, ["contact", "homepage"], "https://www.minecraft.net/zh-hans/")
  );
}

function loadMCMODInfo(obj: Record<string, unknown>, rawInfo: ModInfo): void {
  if (!(obj instanceof Array)) {
    return;
  }
  if (isNull(obj[0])) {
    return;
  }
  const tObj = obj.pop();
  rawInfo.id = String(safeGet(tObj, ["modid"]));
  rawInfo.displayName = String(safeGet(tObj, ["name"], rawInfo.id));
  const tAuthors = safeGet(tObj, ["authors"], []);
  rawInfo.authors = tAuthors instanceof Array ? tAuthors : [];
  rawInfo.logo = String(safeGet(tObj, ["logoFile"], ""));
  rawInfo.mcversion = String(safeGet(tObj, ["mcversion"], "*"));
  rawInfo.version = String(safeGet(tObj, ["version"], "???"));
  rawInfo.description = String(
    safeGet(
      tObj,
      ["description"],
      "No description, website, or topics provided."
    )
  );
  rawInfo.url = String(
    safeGet(tObj, ["url"], "https://www.minecraft.net/zh-hans/")
  );
}

function loadTomlInfo(obj: Record<string, unknown>, rawInfo: ModInfo): void {
  const tAuthors = safeGet(obj, ["authors"]);
  if (tAuthors instanceof Array) {
    rawInfo.authors = tAuthors;
  } else {
    rawInfo.authors = [String(tAuthors)];
  }
  rawInfo.url = String(
    safeGet(obj, ["displayURL"], "https://www.minecraft.net/zh-hans/")
  );
  const mods = safeGet(obj, ["mods"]);
  if (!(mods instanceof Array)) {
    return;
  }
  if (mods.length <= 0) {
    return;
  }
  const mod = mods.pop();
  rawInfo.id = String(safeGet(mod, ["modId"], ""));
  rawInfo.version = String(safeGet(mod, ["version"], ""));
  rawInfo.displayName = String(safeGet(mod, ["displayName"], ""));
  rawInfo.description = String(safeGet(mod, ["description"], ""));
  rawInfo.logo = String(safeGet(mod, ["logoFile"], ""));
  const deps = safeGet(obj, ["dependencies", rawInfo.id]);
  if (!(deps instanceof Array)) {
    rawInfo.mcversion = "*";
    return;
  }
  for (const d of deps) {
    if (safeGet(d, ["modId"]) === "minecraft") {
      rawInfo.mcversion = String(safeGet(d, ["versionRange"], "*"));
    }
  }
  return;
}
