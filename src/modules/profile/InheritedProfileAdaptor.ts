// Inherited Profile Adaptor
// For Forge, Fabric and OptiFine

// Alicorn DON'T WANT to support Forge! Non-automating is simply ridiculous!
// Why not automate? We need it!
// You builds FREE software rather than SPONSOR ones, thank you very much!
// Anyway, we'll keep on supporting Forge since there are tremendous requirements.
import { copy, remove } from "fs-extra";
import path from "path";
import { ReleaseType, SPACE } from "../commons/Constants";
import { isFileExistAndNonEmpty } from "../commons/FileUtil";
import { isNull } from "../commons/Null";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { JAR_SUFFIX } from "../launch/NativesLint";
import { copyProfile, GameProfile } from "./GameProfile";
import { loadProfile } from "./ProfileLoader";

// gfBase <- gfHead, just like merge in git
async function makeInherit(
  gfBase: GameProfile,
  gfHead: GameProfile,
  legacyBit = false
): Promise<GameProfile> {
  const retGF = await copyProfile(gfBase);
  gfHead = await copyProfile(gfHead);
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
    if (!legacyBit) {
      // For legacy profiles there will be same jvm args, ignore it
      retGF.jvmArgs = retGF.jvmArgs.concat(gfHead.jvmArgs);
    }
  }
  if (!isNull(gfHead.gameArgs)) {
    if (legacyBit) {
      retGF.gameArgs = gfHead.gameArgs;
    } else {
      // Game arguments are all of string type and can be handled by noDuplicateConcat
      retGF.gameArgs = retGF.gameArgs.concat(gfHead.gameArgs);
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
    // Incoming Changes Must Come First
    retGF.libraries = gfHead.libraries.concat(retGF.libraries);
  }
  // Which loader use its own client? If it must, it should use library then (
  if (!isNull(gfHead.clientArtifact)) {
    retGF.clientArtifact = gfHead.clientArtifact.clone();
  }
  return retGF;
}

export class InheritedProfile extends GameProfile {
  inheritsFrom = "";

  constructor(obj: string) {
    super((obj = JSON.parse(obj)));
    // @ts-ignore
    this.inheritsFrom = String(obj["inheritsFrom"] || "");
  }

  async produceInherited(
    container: MinecraftContainer,
    legacyBit = false
  ): Promise<GameProfile> {
    if (isNull(this.inheritsFrom)) {
      return this; // NULL safe
    }
    if (this.inheritsFrom === this.id) {
      return this; // No circular
    }
    try {
      const pf = await loadProfile(this.inheritsFrom, container);
      await prepareClient(this.id, this.inheritsFrom, container);
      return await makeInherit(pf, this, legacyBit);
    } catch (e) {
      console.log(e);
      throw "Failed to load dependency profile: " + this.inheritsFrom;
    }
  }
}
async function prepareClient(
  modifiedId: string,
  sourceId: string,
  container: MinecraftContainer
): Promise<void> {
  try {
    const t = path.join(
      container.getVersionRoot(modifiedId),
      modifiedId + JAR_SUFFIX
    );
    if (!(await isFileExistAndNonEmpty(t))) {
      await remove(t);
      await copy(
        path.join(container.getVersionRoot(sourceId), sourceId + JAR_SUFFIX),
        t,
        { dereference: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
}
