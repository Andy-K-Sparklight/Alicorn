import fs from "fs-extra";
import path from "path";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { JAR_SUFFIX } from "../launch/NativesLint";
import { GameProfile } from "./GameProfile";
import { InheritedProfile } from "./InheritedProfileAdaptor";
import { convertFromLegacy } from "./LegacyProfileAdaptor";
import { convertLibsByName } from "./LibrariesConvert";
import { isLegacy, ProfileType, whatProfile } from "./WhatProfile";

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

export async function checkDep(
  container: MinecraftContainer,
  target: string
): Promise<boolean> {
  try {
    await loadProfile(target, container, true);
    return true;
  } catch {
    return false;
  }
}

export async function loadProfile(
  id: string,
  container: MinecraftContainer,
  basicLoad = false
): Promise<GameProfile> {
  let jsonObj;
  try {
    jsonObj = await fs.readJSON(container.getProfilePath(id));
  } catch {
    throw "Profile not exist! Reading: " + id;
  }
  let legacyBit = false;
  if (isLegacy(jsonObj)) {
    legacyBit = true;
    jsonObj = convertFromLegacy(jsonObj);
  }
  const dep = jsonObj["inheritsFrom"];
  if (dep) {
    if (!(await checkDep(container, dep))) {
      throw (
        "Profile depends on another profile: " +
        dep +
        ", while it could not be loaded."
      );
    }
  }
  if (basicLoad) {
    return new GameProfile(jsonObj);
  }
  const vType = whatProfile(String(jsonObj["id"]));
  if (vType === ProfileType.MOJANG) {
    return fixProfileClient(new GameProfile(jsonObj), container);
  }
  jsonObj = convertLibsByName(jsonObj); // Except mojang, others might convert
  return await fixProfileClient(
    new InheritedProfile(JSON.stringify(jsonObj)),
    container
  ).produceInherited(container, legacyBit);
}

function fixProfileClient<T extends GameProfile>(
  profile: T,
  container: MinecraftContainer
): T {
  const c1 = profile.clientArtifact.clone();
  if (!path.isAbsolute(c1.path)) {
    c1.path = path.resolve(
      container.getVersionRoot(profile.id),
      profile.id + JAR_SUFFIX
    );
    profile.clientArtifact = c1;
  }

  return profile;
}
