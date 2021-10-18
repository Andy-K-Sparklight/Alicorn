// Inherited Profile Adaptor
// For Forge, Fabric and OptiFine

// Alicorn DON'T WANT to support Forge! Non-automating is simply ridiculous!
// Why not automate? We need it!
// You builds FREE software rather than SPONSOR ones, thank you very much!
// Anyway, we'll keep on supporting Forge since there are tremendous requirements.
import { copy } from "fs-extra";
import objectHash from "object-hash";
import path from "path";
import { schedulePromiseTask } from "../../renderer/Schedule";
import { ReleaseType, SPACE } from "../commons/Constants";
import { isFileExist } from "../commons/FileUtil";
import { isNull } from "../commons/Null";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { JAR_SUFFIX } from "../launch/NativesLint";
import { copyProfile, GameProfile } from "./GameProfile";
import { loadProfile } from "./ProfileLoader";

// gfBase <- gfHead, just like merge in git
export async function makeInherit(
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

export async function abortableNoDuplicateConcat<T>(
  a1: T[],
  a2: T[]
): Promise<T[]> {
  const copy = a2.concat();
  const hashList = await Promise.all(
    copy.map((a) => {
      return schedulePromiseTask(async () => {
        return objectHash(a);
      });
    })
  );
  const buff: T[] = [];
  for (const x of a1) {
    const xh = await schedulePromiseTask(async () => {
      return objectHash(x);
    });
    if (!hashList.includes(xh) && !a2.includes(x)) {
      buff.push(x);
    }
  }
  return buff.concat(copy);
}

/**
 * @deprecated use abortable one instead
 */
// a1 <- a2, a2 overrides a1 if necessary
export function noDuplicateConcat<T>(a1: T[], a2: T[]): T[] {
  const copy = a2.concat();
  const hashList = copy.map((a) => {
    return objectHash(a);
  });
  const buff: T[] = [];
  for (const x of a1) {
    const xh = objectHash(x);
    if (!hashList.includes(xh) && !a2.includes(x)) {
      buff.push(x);
    }
  }
  return buff.concat(copy);
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
    } catch {
      throw (
        "Failed to load dependency profile or prepare client! Loading: " +
        this.inheritsFrom
      );
    }
  }
}
async function prepareClient(
  modifiedId: string,
  sourceId: string,
  container: MinecraftContainer
): Promise<void> {
  const t = path.join(
    container.getVersionRoot(modifiedId),
    modifiedId + JAR_SUFFIX
  );
  if (
    window.sessionStorage.getItem(
      "ClientOK." + container.id + "/" + modifiedId
    ) === "1"
  ) {
    return;
  }
  if (!(await isFileExist(t))) {
    await copy(
      path.join(container.getVersionRoot(sourceId), sourceId + JAR_SUFFIX),
      t
    );
    window.sessionStorage.setItem(
      "ClientOK." + container.id + "/" + modifiedId,
      "1"
    );
  }
}
