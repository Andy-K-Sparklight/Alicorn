import { getNumber } from "../../config/ConfigSupport";
import {
  AddonInfo,
  File,
  getAddonInfoBySlug,
  lookupAddonInfo,
  lookupFileInfo,
  moreAddonInfoBySlug,
} from "../curseforge/Get";
import {
  findCompatibleArtifact,
  getModMetaBySlug,
  getVersionListForMod,
  lookupModMetaInfo,
  searchMetaBySlug,
} from "../modrinth/Get";
import { addToLockfile, Lockfile2 } from "./Lockfile";
import { ModArtifact, ModMeta } from "./ModDefine";

// One resolver is for one mod slug
export interface ModResolver {
  mainId: string | undefined; // Selected, like dpkg
  artifactId: string | undefined; // Selected
  resolveMod(): Promise<ModMeta>;
  searchMods(num: number): Promise<ModMeta[]>;
  getArtifactFor(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<ModArtifact>;
  canSupport(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<boolean>;
  setSelected(
    mainId: string | undefined,
    artifactId: string | undefined
  ): Promise<void>;
  writeLock(lockfile: Lockfile2): Promise<void>;
  clearCached(): Promise<void>;
}

export abstract class AbstractModResolver implements ModResolver {
  public mainId: string | undefined; // Selected, like dpkg
  public artifactId: string | undefined; // Selected
  public slug: string;
  public cachedMeta: ModMeta | undefined;
  public cachedArtifact: ModArtifact | undefined;
  public constructor(slug: string) {
    this.slug = slug;
  }
  writeLock(lockfile: Lockfile2): Promise<void> {
    if (!this.cachedMeta || !this.cachedArtifact) {
      throw "Must resolve first!";
    }
    addToLockfile(lockfile, this.cachedMeta, this.cachedArtifact);
    return Promise.resolve();
  }
  abstract resolveMod(): Promise<ModMeta>;
  abstract searchMods(num: number): Promise<ModMeta[]>;
  abstract getArtifactFor(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<ModArtifact>;
  abstract canSupport(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<boolean>;
  abstract setSelected(
    mainId: string | undefined,
    artifactId: string | undefined
  ): Promise<void>;
  abstract clearCached(): Promise<void>;
}

export class CurseforgeModResolver extends AbstractModResolver {
  protected static CF_API_BASE = "https://addons-ecs.forgesvc.net";
  protected insideCachedAddonInfo: AddonInfo | undefined;
  async resolveMod(): Promise<ModMeta> {
    if (this.cachedMeta) {
      return this.cachedMeta;
    }
    let b: AddonInfo | undefined;
    if (this.mainId) {
      b = await lookupAddonInfo(
        this.mainId,
        CurseforgeModResolver.CF_API_BASE,
        getNumber("download.pff.timeout")
      );
    } else {
      b = await getAddonInfoBySlug(
        this.slug,
        CurseforgeModResolver.CF_API_BASE,
        "",
        getNumber("pff.page-size"),
        false,
        getNumber("download.pff.timeout")
      );
    }
    if (b) {
      this.insideCachedAddonInfo = b;
      const m = transformAddonInfoToMeta(b);
      this.cachedMeta = m;
      this.mainId = m.id; // Select
      return m;
    }
    throw `Could not resolve '${this.slug}'!`;
  }
  async searchMods(num: number): Promise<ModMeta[]> {
    const s = await moreAddonInfoBySlug(
      this.slug,
      CurseforgeModResolver.CF_API_BASE,
      "",
      getNumber("pff.page-size"),
      getNumber("download.pff.timeout")
    );
    const o: ModMeta[] = [];
    for (const ss of s) {
      if (ss.type === "MOD") {
        o.push(transformAddonInfoToMeta(ss));
        if (o.length >= num) {
          break;
        }
      }
    }
    return o;
  }
  async getArtifactFor(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<ModArtifact> {
    if (this.cachedArtifact) {
      return this.cachedArtifact;
    }
    if (!this.insideCachedAddonInfo) {
      throw "Must resolve first!";
    }
    let af = this.artifactId; // If selected then use
    if (!af) {
      for (const x of this.insideCachedAddonInfo.gameVersionLatestFiles) {
        if (
          x.gameVersion === gameVersion &&
          modLoaderOf(x.modLoader) === modLoader
        ) {
          this.artifactId = af = x.projectFileId.toString(); // Select
          break;
        }
      }
    }
    if (!af) {
      throw "Check compatibility first!";
    }
    const f = await lookupFileInfo(
      this.insideCachedAddonInfo,
      af,
      CurseforgeModResolver.CF_API_BASE,
      getNumber("download.pff.timeout")
    );
    if (f) {
      this.cachedArtifact = transformFileInfoToArtifact(f, modLoader);
      return this.cachedArtifact;
    }
    throw "Failed to lookup artifact!";
  }
  canSupport(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<boolean> {
    if (!this.insideCachedAddonInfo) {
      throw "Must resolve first!";
    }
    for (const gf of this.insideCachedAddonInfo.gameVersionLatestFiles) {
      if (
        gf.gameVersion === gameVersion &&
        modLoaderOf(gf.modLoader) === modLoader
      ) {
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  }
  setSelected(
    mainId: string | undefined,
    artifactId: string | undefined
  ): Promise<void> {
    this.mainId = mainId;
    this.artifactId = artifactId;
    return Promise.resolve();
  }
  clearCached(): Promise<void> {
    this.insideCachedAddonInfo = undefined;
    this.cachedMeta = undefined;
    this.cachedArtifact = undefined;
    return Promise.resolve();
  }
}

export class ModrinthModResolver extends AbstractModResolver {
  protected insideCachedArtifactList: ModArtifact[] | undefined;
  protected static MR_BASE_URL = "https://api.modrinth.com";
  async resolveMod(): Promise<ModMeta> {
    if (this.cachedMeta) {
      return this.cachedMeta;
    }
    let b: ModMeta | undefined;
    if (this.mainId) {
      b = await lookupModMetaInfo(
        this.mainId,
        ModrinthModResolver.MR_BASE_URL,
        getNumber("download.pff.timeout")
      );
    } else {
      b = await getModMetaBySlug(
        this.slug,
        ModrinthModResolver.MR_BASE_URL,
        getNumber("download.pff.timeout")
      );
    }
    if (b) {
      this.mainId = b.id;
      this.cachedMeta = b;
      return b;
    }
    throw `Could not resolve '${this.slug}'!`;
  }
  searchMods(num: number): Promise<ModMeta[]> {
    return searchMetaBySlug(
      this.slug,
      ModrinthModResolver.MR_BASE_URL,
      num,
      getNumber("download.pff.timeout")
    );
  }
  async getArtifactFor(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<ModArtifact> {
    if (this.cachedArtifact) {
      return this.cachedArtifact;
    }
    if (!this.mainId) {
      throw "Must resolve first!";
    }
    this.insideCachedArtifactList =
      this.insideCachedArtifactList ||
      (await getVersionListForMod(
        this.mainId,
        ModrinthModResolver.MR_BASE_URL,
        getNumber("download.pff.timeout")
      ));
    const s = findCompatibleArtifact(
      this.insideCachedArtifactList,
      gameVersion,
      modLoader
    );
    if (s) {
      this.cachedArtifact = s;
      return s;
    }
    throw "Check compatibility first!";
  }
  async canSupport(
    gameVersion: string,
    modLoader: "Fabric" | "Forge"
  ): Promise<boolean> {
    if (!this.mainId) {
      throw "Must resolve first!";
    }
    this.insideCachedArtifactList =
      this.insideCachedArtifactList ||
      (await getVersionListForMod(
        this.mainId,
        ModrinthModResolver.MR_BASE_URL,
        getNumber("download.pff.timeout")
      ));
    return (
      findCompatibleArtifact(
        this.insideCachedArtifactList,
        gameVersion,
        modLoader
      ) !== undefined
    );
  }
  setSelected(
    mainId: string | undefined,
    artifactId: string | undefined
  ): Promise<void> {
    this.mainId = mainId;
    this.artifactId = artifactId;
    return Promise.resolve();
  }
  clearCached(): Promise<void> {
    this.insideCachedArtifactList = undefined;
    this.cachedMeta = undefined;
    this.cachedArtifact = undefined;
    return Promise.resolve();
  }
}

function transformAddonInfoToMeta(aInfo: AddonInfo): ModMeta {
  const sv: string[] = [];
  aInfo.gameVersionLatestFiles.forEach((f) => {
    if (!sv.includes(f.gameVersion)) {
      sv.push(f.gameVersion);
    }
  });
  return {
    id: aInfo.id.toString(),
    displayName: aInfo.name,
    thumbNail: aInfo.thumbNail,
    supportVersions: sv,
    provider: "Curseforge",
    slug: aInfo.slug,
  };
}

export function modLoaderOf(type: number): "Forge" | "Fabric" | undefined {
  if (type === 1) {
    return "Forge";
  }
  if (type === 4) {
    return "Fabric";
  }
}

function transformFileInfoToArtifact(
  file: File,
  modLoader: "Fabric" | "Forge"
): ModArtifact {
  return {
    downloadUrl: file.downloadUrl,
    fileName: file.fileName,
    gameVersion: file.gameVersion,
    modLoader: modLoader,
    id: file.id.toString(),
    size: file.fileLength,
  };
}
