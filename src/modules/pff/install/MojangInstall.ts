import fs from "fs-extra";
import path from "path";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureLibraries,
  ensureLog4jFile,
  ensureNatives,
} from "../../launch/Ensurance";
import { GameProfile } from "../../profile/GameProfile";
/**
 * @deprecated
 */
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
