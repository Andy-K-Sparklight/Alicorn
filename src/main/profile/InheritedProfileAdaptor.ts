// Inherited Profile Adaptor
// For Forge, Fabric and OptiFine

// Alicorn DON'T WANT to support Forge! Non-automating is simply ridiculous!
// Why not automate? We need it!
// You builds FREE software rather than SPONSOR ones, thank you very much!
// Anyway, we'll keep on supporting Forge since there are tremendous requirements.

import { GameProfile, ReleaseType } from "./GameProfile";
import { MinecraftContainer } from "../container/MinecraftContainer";
import fs from "fs-extra";
import { SPACE } from "../launch/ArgsGenerator";
import { ArtifactMeta, AssetIndexArtifactMeta, ClassifiersMeta } from "./Meta";

const NULL_OBJECTS = new Set<unknown>();
registerNullObject(ArtifactMeta.emptyArtifactMeta());
registerNullObject(AssetIndexArtifactMeta.emptyAssetIndexArtifactMeta());
registerNullObject(ClassifiersMeta.emptyClassifiersMeta());

export function makeInherit(
  gfBase: GameProfile,
  gfHead: GameProfile
): GameProfile {
  const retGF = Object.assign({}, gfBase);
  // Though you might call yourself 'release', we suggest that this is a modified one.
  retGF.type = ReleaseType.MODIFIED;
  if (!isNull(gfHead.mainClass)) {
    retGF.mainClass = gfHead.mainClass;
  }
  if (!isNull(gfHead.releaseTime)) {
    retGF.releaseTime = gfHead.releaseTime;
  }
  if (!isNull(gfHead.time)) {
    retGF.time = gfHead.time;
  }
  if (!isNull(gfHead.jvmArgs)) {
    retGF.jvmArgs = retGF.jvmArgs.concat(gfHead.jvmArgs);
  }
  if (!isNull(gfHead.gameArgs)) {
    retGF.gameArgs = retGF.gameArgs.concat(gfHead.gameArgs);
  }
  if (!isNull(gfHead.id)) {
    retGF.id = gfHead.id;
  }
  if (!isNull(gfHead.logArg)) {
    retGF.logArg += SPACE + gfHead.logArg;
  }
  if (!isNull(gfHead.assetIndex)) {
    retGF.assetIndex = gfHead.assetIndex;
  }
  if (!isNull(gfHead.libraries)) {
    retGF.libraries = retGF.libraries.concat(gfHead.libraries);
  }
  if (!isNull(gfHead.clientArtifact)) {
    retGF.clientArtifact = gfHead.clientArtifact;
  }

  return retGF;
}

export class InheritedProfile extends GameProfile {
  inheritsFrom = "";

  constructor(obj: Record<string, unknown>) {
    super(obj);
    this.inheritsFrom = String(obj["inheritsFrom"]);
  }

  async productInherited(container: MinecraftContainer): Promise<GameProfile> {
    return makeInherit(
      await loadProfileDirectly(this.inheritsFrom, container),
      this
    );
  }
}

async function loadProfileDirectly(
  id: string,
  container: MinecraftContainer
): Promise<GameProfile> {
  try {
    return new GameProfile(await fs.readJSON(container.getProfilePath(id)));
  } catch (e) {
    throw new Error("Cannot load profile! Caused by: " + e);
  }
}

export function registerNullObject(obj: unknown): void {
  NULL_OBJECTS.add(obj);
}

export function isNull(obj: unknown): boolean {
  try {
    return (
      obj === undefined ||
      obj === null ||
      obj === "" ||
      NULL_OBJECTS.has(obj) ||
      // @ts-ignore
      obj.length === 0
    );
  } catch {
    return false;
  }
}
