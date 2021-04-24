import { MinecraftContainer } from "../container/MinecraftContainer";
import { loadModInfo, ModInfo, ModLoader } from "./ModInfo";
import fs from "fs-extra";
import { canModVersionApply, gatherVersionInfo } from "./VersionUtil";
import { ProfileType } from "../profile/WhatProfile";
import { getBoolean } from "../config/ConfigSupport";
import path from "path";
import { GameProfile } from "../profile/GameProfile";
import { JAR_SUFFIX } from "../launch/NativesLint";
// How we manage mods:
// Before launch:
// 1. Info loading: load all metas in 'mods' folder
// 2. Marking: mark all mods that can not be loaded and make deltas
// 3. Moving: move incompatible mods to 'alicorn-mods-dyn'
// After launch:
// 1. Remarking: regenerate deltas
// 2. Moving: move mods back to 'mods' folder
// 3. Cleaning: delete 'alicorn-mods-dyn'

async function loadMetas(container: MinecraftContainer): Promise<ModInfo[]> {
  try {
    const allFiles = await fs.readdir(container.getModsRoot());
    const allMods: string[] = [];
    for (const x of allFiles) {
      if (x.endsWith(JAR_SUFFIX)) {
        allMods.push(x);
      }
    }
    return await Promise.all(
      allMods.map((m) => {
        return new Promise<ModInfo>((resolve) => {
          loadModInfo(m, container).then((d) => {
            d.fileName = d.fileName || container.getModJar(m);
            // If this meta is loaded from cache we should regenerate
            resolve(d);
          });
        });
      })
    );
  } catch {
    return [];
  }
}

async function moveModsTo(
  mods: ModInfo[],
  container: MinecraftContainer,
  mcVersion: string,
  type: ProfileType
): Promise<void> {
  const toProcess: ModInfo[] = [];
  try {
    for (const mi of mods) {
      if (
        getBoolean("modx.ignore-non-standard-mods") &&
        mi.loader === ModLoader.UNKNOWN
      ) {
        continue;
      }

      if (
        mi.loader?.toString() !== type.toString() ||
        !canModVersionApply(mi.mcversion || "", mcVersion)
      ) {
        toProcess.push(mi);
      }
    }
    await fs.emptydir(container.getDynamicModsRoot());
    await Promise.all(
      toProcess.map((m) => {
        return new Promise<void>((resolve) => {
          if (m.fileName !== undefined) {
            const pt = path.resolve(m.fileName);
            fs.copyFile(
              pt,
              container.getDynamicModJar(path.basename(m.fileName)),
              () => {
                fs.remove(pt, () => {
                  resolve();
                });
              }
            );
          } else {
            resolve();
          }
        });
      })
    );
  } catch {}
}

export async function restoreMods(
  container: MinecraftContainer
): Promise<void> {
  if (!getBoolean("modx.global-dynamic-load-mods")) {
    return;
  }
  try {
    const all = await fs.readdir(container.getDynamicModsRoot());
    await Promise.all(
      all.map((f) => {
        return new Promise<void>((resolve) => {
          fs.copyFile(
            container.getDynamicModJar(f),
            container.getModJar(f),
            () => {
              resolve();
            }
          );
        });
      })
    );
    await fs.remove(container.getDynamicModsRoot());
  } catch {}
}

export async function prepareModsCheckFor(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<void> {
  if (!getBoolean("modx.global-dynamic-load-mods")) {
    return;
  }
  try {
    const stat = gatherVersionInfo(profile);
    await moveModsTo(
      await loadMetas(container),
      container,
      stat.version,
      stat.type
    );
  } catch {}
}
