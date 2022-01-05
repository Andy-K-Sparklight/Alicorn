import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import toml from "toml";
import { submitWarn } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { isNull, safeGet } from "../commons/Null";
import { MinecraftContainer } from "../container/MinecraftContainer";

const MCMOD_INFO = "mcmod.info";
const FABRIC_MOD_JSON = "fabric.mod.json";
const MODS_TOML = "mods.toml";
const META_INF = "META-INF";

export interface ModInfo {
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
// Load mod info
export async function loadModInfo(
  modJar: string,
  container: MinecraftContainer
): Promise<ModInfo> {
  try {
    const ret: ModInfo = {};
    ret.fileName = container.getModJar(modJar);
    let d: number;
    try {
      d = await fs.open(ret.fileName, "r"); // Control this manually
    } catch (e) {
      submitWarn(tr("System.EPERM"));
      throw e;
    }
    const zip = new StreamZip.async({
      fd: d,
    });
    try {
      const d2 = await zip.entryData(FABRIC_MOD_JSON);
      ret.loader = ModLoader.FABRIC;
      loadFabricInfo(JSON.parse(escapeQuote(d2.toString())), ret);
      void zip.close();
      void fs.close(d);
      return ret;
    } catch {}

    try {
      const d2 = await zip.entryData(META_INF + "/" + MODS_TOML);
      ret.loader = ModLoader.FORGE;
      loadTomlInfo(toml.parse(d2.toString()), ret);
      void zip.close();
      void fs.close(d);
      return ret;
    } catch {}

    try {
      const d2 = await zip.entryData(MCMOD_INFO);
      ret.loader = ModLoader.FORGE;
      loadMCMODInfo(JSON.parse(escapeQuote(d2.toString())), ret);
      void zip.close();
      void fs.close(d);
      return ret;
    } catch {}
    // Bad Loader
    void zip.close();
    void fs.close(d);
    return {
      fileName: container.getModJar(modJar),
      loader: ModLoader.UNKNOWN,
    };
  } catch {
    return { fileName: container.getModJar(modJar), loader: ModLoader.UNKNOWN };
  }
}

function loadFabricInfo(obj: Record<string, unknown>, rawInfo: ModInfo): void {
  const j0 = safeGet(obj, ["depends", "minecraft"], "*") || "*";
  let j1 = String(j0);
  if (j0 instanceof Array) {
    j1 = j0.join(" || ");
  }
  rawInfo.mcversion = escapeVersion(j1);
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
  const tAuthors = safeGet(tObj, ["authorList"], []);
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
    rawInfo.authors = [String(tAuthors || "")];
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
  rawInfo.mcversion = "*"; // Firstly overwrite
  // TODO: use forge version to infer minecraft version
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

export function escapeQuote(s: string): string {
  return s.replaceAll('\\"', "'").replaceAll("\r", "").replaceAll("\n", " ");
}

const COERCE_REGEX = /(?<=[0-9])-[A-Za-z][0-9A-Za-z.]*/gi;
const END_REGEX = /-([A-Za-z][0-9A-Za-z.]*)?$/;
function escapeVersion(s: string): string {
  return String(eval('"' + s + '"'))
    .replaceAll(COERCE_REGEX, "")
    .replace(END_REGEX, "")
    .replaceAll("~", ""); // Total ignore
}
