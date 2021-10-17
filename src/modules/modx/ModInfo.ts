import StreamZip from "node-stream-zip";
import toml from "toml";
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
    const zip = new StreamZip.async({ file: ret.fileName });
    try {
      let d = await zip.entryData(FABRIC_MOD_JSON);
      ret.loader = ModLoader.FABRIC;
      loadFabricInfo(JSON.parse(escapeQuote(d.toString())), ret);
      return ret;
    } catch {}

    try {
      let d = await zip.entryData(META_INF + "/" + MODS_TOML);
      ret.loader = ModLoader.FORGE;
      loadTomlInfo(toml.parse(d.toString()), ret);
      return ret;
    } catch {}

    try {
      let d = await zip.entryData(MCMOD_INFO);
      ret.loader = ModLoader.FORGE;
      loadMCMODInfo(JSON.parse(escapeQuote(d.toString())), ret);
      return ret;
    } catch {}
    // Bad Loader
    return {
      fileName: container.getModJar(modJar),
      loader: ModLoader.UNKNOWN,
    };
  } catch {
    return { fileName: container.getModJar(modJar) };
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

function escapeQuote(s: string): string {
  return s.replaceAll('\\"', "'").replaceAll("\r", "").replaceAll("\n", "");
}
