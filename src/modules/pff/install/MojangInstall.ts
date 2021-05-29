import { MinecraftContainer } from "../../container/MinecraftContainer";
import fs from "fs-extra";
import path from "path";
import { GameProfile } from "../../profile/GameProfile";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureLibraries,
  ensureLog4jFile,
  ensureNatives,
} from "../../launch/Ensurance";

export async function installProfile(
  id: string,
  profile: unknown,
  container: MinecraftContainer
): Promise<boolean> {
  try {
    const td = container.getProfilePath(id);
    await fs.ensureDir(path.dirname(td));
    await fs.writeFile(td, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export async function fillProfile(
  profile: GameProfile,
  container: MinecraftContainer
): Promise<boolean> {
  try {
    await ensureLibraries(profile, container);
    await ensureNatives(profile, container);
    await ensureAssetsIndex(profile, container);
    await ensureAllAssets(profile, container);
    await ensureLog4jFile(profile, container);
    return true;
  } catch {
    return false;
  }
}
