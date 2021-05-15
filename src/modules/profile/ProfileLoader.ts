import { MinecraftContainer } from "../container/MinecraftContainer";
import { GameProfile } from "./GameProfile";
import fs from "fs-extra";
import { isLegacy, ProfileType, whatProfile } from "./WhatProfile";
import { convertFromFabric } from "./FabricProfileAdaptor";
import { convertFromLegacy } from "./LegacyProfileAdaptor";
import { InheritedProfile } from "./InheritedProfileAdaptor";
import path from "path";
import { JAR_SUFFIX } from "../launch/NativesLint";

export async function loadProfileDirectly(
  id: string,
  container: MinecraftContainer
): Promise<GameProfile> {
  try {
    return new GameProfile(await fs.readJSON(container.getProfilePath(id)));
  } catch (e) {
    throw new Error("Cannot load profile! Caused by: " + e);
  }
}

export async function loadProfile(
  id: string,
  container: MinecraftContainer
): Promise<GameProfile> {
  let jsonObj = await fs.readJSON(container.getProfilePath(id));
  const vType = whatProfile(String(jsonObj["id"]));
  let legacyBit = false;
  if (isLegacy(jsonObj)) {
    legacyBit = true;
    jsonObj = convertFromLegacy(jsonObj);
  }
  if (vType === ProfileType.MOJANG) {
    return fixProfileClient(new GameProfile(jsonObj), container);
  }
  if (vType === ProfileType.FABRIC) {
    jsonObj = convertFromFabric(jsonObj);
  }
  return await fixProfileClient(
    new InheritedProfile(JSON.stringify(jsonObj)),
    container
  ).produceInherited(container, legacyBit);
}

function fixProfileClient<T extends GameProfile>(
  profile: T,
  container: MinecraftContainer
): T {
  const cas = profile.clientArtifacts.concat();
  profile.clientArtifacts = [];
  for (const ca of cas) {
    const c1 = ca.clone();
    if (!path.isAbsolute(c1.path)) {
      c1.path = path.resolve(
        container.getVersionRoot(profile.id),
        profile.id + JAR_SUFFIX
      );
    }
    profile.clientArtifacts.push(c1);
  }

  return profile;
}
