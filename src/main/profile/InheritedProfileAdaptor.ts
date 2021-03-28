// Inherited Profile Adaptor
// For Forge, Fabric and OptiFine

// Alicorn DON'T WANT to support Forge! Non-automating is simply ridiculous!
// Why not automate? We need it!
// You builds FREE software rather than SPONSOR ones, thank you very much!
// Anyway, we'll keep on supporting Forge since there are tremendous requirements.

import { GameProfile, ReleaseType } from "./GameProfile";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { loadProfile } from "./ProfileLoader";
import { SPACE } from "../commons/Constants";
import { isNull } from "../commons/Null";

// gfBase <- gfHead, just like merge in git
export function makeInherit(
  gfBase: GameProfile,
  gfHead: GameProfile,
  legacyBit = false
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
    retGF.jvmArgs = noDuplicateConcat(retGF.jvmArgs, gfHead.jvmArgs);
  }
  if (!isNull(gfHead.gameArgs)) {
    if (legacyBit) {
      retGF.gameArgs = gfHead.gameArgs;
    } else {
      retGF.gameArgs = noDuplicateConcat(retGF.gameArgs, gfHead.gameArgs);
    }
  }
  if (!isNull(gfHead.id)) {
    retGF.id = gfHead.id;
  }
  if (!isNull(gfHead.logArg)) {
    if (isNull(retGF.logArg)) {
      retGF.logArg = gfHead.logArg;
    } else {
      retGF.logArg += SPACE + gfHead.logArg;
    }
  }
  if (!isNull(gfHead.logFile)) {
    retGF.logFile = gfHead.logFile;
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

export function noDuplicateConcat<T>(a1: T[], a2: T[]): T[] {
  const copy = a1.concat();
  for (const x of a2) {
    if (!a1.includes(x)) {
      copy.push(x);
    }
  }
  return copy;
}

export class InheritedProfile extends GameProfile {
  inheritsFrom = "";

  constructor(obj: Record<string, unknown>) {
    super(obj);
    this.inheritsFrom = String(obj["inheritsFrom"] || "");
  }

  async produceInherited(
    container: MinecraftContainer,
    legacyBit = false
  ): Promise<GameProfile> {
    if (isNull(this.inheritsFrom)) {
      return this;
    }
    if (this.inheritsFrom === this.id) {
      return this;
    }
    return makeInherit(
      await loadProfile(this.inheritsFrom, container),
      this,
      legacyBit
    );
  }
}
