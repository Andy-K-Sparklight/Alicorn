import { readdir, stat } from "fs-extra";
import path from "path";
import { isFileExist } from "../../commons/FileUtil";
import { scanCoresIn } from "../../container/ContainerScanner";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { getHash } from "../../download/Validate";
import {
  inferModLoaderVersionFabric,
  inferModLoaderVersionForge,
  ProfileType,
  whatProfile,
} from "../../profile/WhatProfile";
import { loadLockfile } from "../virtual/Lockfile";

type DefinedDesc =
  | "ResourcePack" // resourcepacks/* FILE
  | "ShaderPack" // shaderpacks/* FILE
  | "PffMod" // pff.lock autobulid MOD
  | "ModFile" // mods/* FILE
  | "World" // saves/* FILE
  | "OptionFile" // options.txt FILE
  | "Game" // versions/* (Minecraft) ADDON
  | "ModLoader" // versions/* (Forge, Fabric) ADDON
  | "Config"; // config/*; FILE
export interface UnifiedAsset {
  type: "FILE" | "MOD" | "ADDON" | "DIR"; // DIR requires resolve
  desc: DefinedDesc; // Dedicated to file, not folder, if dir, should be resolved on build
  v1: string; // 'path', 'projectID' or 'id'
  v2: string; // 'hash', 'fileID' or 'version'
  mcv?: string; // Fabric core special
  pffName?: string; // Pff special
  pffFileName?: string; // Pff special
}

export async function scanContainerAssets(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  return (await scanProfiles(container))
    .concat(await scanPffMods(container))
    .concat(await scanModFiles(container))
    .concat(await scanResourcePacks(container))
    .concat(await scanShaderPacks(container))
    .concat(await scanOptions(container))
    .concat(await scanConfig(container))
    .concat(await scanSaves(container));
}

async function scanPffMods(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  try {
    const pf = await loadLockfile(container);
    return Object.values(pf).map((f) => {
      return {
        type: "MOD",
        desc: "PffMod",
        v1: f.id.toString(),
        v2: f.selectedArtifact.id.toString(),
        pffName: f.displayName,
        pffFileName: f.selectedArtifact.fileName,
      };
    });
  } catch {
    return [];
  }
}

const MOD_JAR = /\.(jar|litemod)$/i;

async function scanModFiles(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  return await scan(container.getModsRoot(), "ModFile", false, true, MOD_JAR);
}
const SESSION_LOCK = "session.lock";

async function scanSaves(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  return await scan(
    container.getSavesRoot(),
    "World",
    true,
    false,
    undefined,
    async (d) => {
      return await isFileExist(path.join(d, SESSION_LOCK));
    }
  );
}

const RESOURCE_ZIP = /\.zip$/i;
const PACK_MCMETA = "pack.mcmeta";

async function scanResourcePacks(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  return await scan(
    container.getResourcePacksRoot(),
    "ResourcePack",
    true,
    true,
    RESOURCE_ZIP,
    async (d) => {
      return await isFileExist(path.join(d, PACK_MCMETA));
    }
  );
}

const SHADER_ZIP = /\.zip$/i;
const SHADERS = "shaders";

async function scanOptions(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  const t = path.join(container.rootDir, "options.txt");
  if (await isFileExist(t)) {
    return [{ type: "FILE", desc: "OptionFile", v1: t, v2: await getHash(t) }];
  } else {
    return [];
  }
}

const CONFIG_DIR = "config";

async function scanConfig(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  try {
    const cRoot = path.join(container.rootDir, CONFIG_DIR);
    if (await isFileExist(cRoot)) {
      return [
        {
          type: "DIR",
          desc: "Config",
          v1: cRoot,
          v2: "",
        },
      ];
    } else {
      return [];
    }
  } catch {
    return [];
  }
}

async function scanShaderPacks(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  return await scan(
    container.getShaderPacksRoot(),
    "ShaderPack",
    true,
    true,
    SHADER_ZIP,
    async (d) => {
      return await isFileExist(path.join(d, SHADERS));
    }
  );
}

async function scan(
  pt: string,
  desc: DefinedDesc,
  dir = true,
  file = true,
  regexp?: RegExp, // Only for file
  judge: (d: string) => Promise<boolean> = () => Promise.resolve(true)
): Promise<UnifiedAsset[]> {
  try {
    const dContent = await readdir(pt);
    const output: UnifiedAsset[] = [];
    await Promise.allSettled(
      dContent.map(async (d) => {
        const cDir = path.join(pt, d);
        const s = await stat(cDir);
        if (s.isDirectory()) {
          if (dir) {
            try {
              if (await judge(cDir)) {
                output.push({
                  type: "DIR",
                  desc: desc,
                  v1: cDir,
                  v2: "",
                });
              }
            } catch {}
          }
        }
        if (s.isFile()) {
          if (regexp) {
            if (!regexp.test(cDir)) {
              return;
            }
          }
          if (file) {
            try {
              output.push({
                type: "FILE",
                desc: desc,
                v1: cDir,
                v2: await getHash(cDir),
              });
            } catch {}
          }
        }
      })
    );
    return output;
  } catch {
    return [];
  }
}

async function scanProfiles(
  container: MinecraftContainer
): Promise<UnifiedAsset[]> {
  try {
    const cores = await scanCoresIn(container);
    const o: UnifiedAsset[] = [];
    cores.forEach((c) => {
      const type = whatProfile(c);
      let t: string;
      let w: DefinedDesc;
      let v = "";
      let mcv: string | undefined;
      switch (type) {
        case ProfileType.MOJANG:
          t = "game";
          w = "Game";
          v = c;
          break;
        case ProfileType.FORGE:
          t = "forge";
          w = "ModLoader";
          v = inferModLoaderVersionForge(c);
          break;
        case ProfileType.FABRIC:
          t = "fabric";
          w = "ModLoader";
          v = inferModLoaderVersionFabric(c);
          mcv = c.split("-").pop() || undefined;
          break;
        default:
          return; // Currently OptiFine is not supported, and never until it become a free software.
      }
      if (v.trim().length === 0) {
        return;
      }
      o.push({
        type: "ADDON",
        desc: w,
        v1: t,
        v2: v.trim(),
        mcv: mcv,
      });
    });
    return o;
  } catch {
    return [];
  }
}
