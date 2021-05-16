import { MinecraftContainer } from "../container/MinecraftContainer";
import { loadModInfo, ModInfo, ModLoader } from "./ModInfo";
import fs from "fs-extra";
import { canModVersionApply, gatherVersionInfo } from "./VersionUtil";
import { ProfileType } from "../profile/WhatProfile";
import { getBoolean } from "../config/ConfigSupport";
import path from "path";
import { GameProfile } from "../profile/GameProfile";
import { JAR_SUFFIX } from "../launch/NativesLint";
import { FileOperateReport, LaunchTracker } from "../launch/Tracker";
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
  type: ProfileType,
  tFile: FileOperateReport
): Promise<void> {
  const toProcess: ModInfo[] = [];
  try {
    tFile.total = mods.length;
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
        console.log("We need to operate " + mi.fileName);
        toProcess.push(mi);
      } else {
        tFile.operateRecord.push({
          file: mi.fileName || "",
          operation: "SKIPPED",
        });
      }
    }
    tFile.resolved = toProcess.length;
    await fs.emptydir(container.getDynamicModsRoot());
    await Promise.all(
      toProcess.map((m) => {
        const mf = m.fileName;
        return new Promise<void>((resolve) => {
          if (mf !== undefined) {
            console.log("Processing " + mf);
            const pt = path.resolve(mf);
            fs.copyFile(
              pt,
              container.getDynamicModJar(path.basename(mf)),
              (e) => {
                console.log("Copy callback " + pt);
                if (!e) {
                  fs.remove(pt, (e) => {
                    console.log("Del callback " + pt);
                    if (e) {
                      console.log("Error processing " + mf);
                      console.log(e);
                      tFile.resolved--;
                      tFile.operateRecord.push({
                        file: mf || "",
                        operation: "FAILED",
                      });
                    } else {
                      console.log("Operated " + mf);
                      tFile.operateRecord.push({
                        file: mf || "",
                        operation: "OPERATED",
                      });
                    }
                    resolve();
                  });
                } else {
                  console.log("Error processing " + mf);
                  console.log(e);
                  tFile.operateRecord.push({
                    file: mf || "",
                    operation: "FAILED",
                  });
                  tFile.resolved--;
                  resolve();
                }
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
  container: MinecraftContainer,
  tracker?: LaunchTracker
): Promise<void> {
  if (!getBoolean("modx.global-dynamic-load-mods")) {
    return;
  }
  const tFile: FileOperateReport = { total: 0, resolved: 0, operateRecord: [] };
  try {
    const stat = gatherVersionInfo(profile);
    await moveModsTo(
      await loadMetas(container),
      container,
      profile.baseVersion,
      stat.type,
      tFile
    );
    tracker?.mods(tFile);
  } catch {}
}
