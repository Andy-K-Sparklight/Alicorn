import path from "path";
import { getNativeArtifact, JAR_SUFFIX } from "../launch/NativesLint";
import { LibraryMeta } from "../profile/Meta";

export class MinecraftContainer {
  id = "";
  rootDir = "";
  private readonly assetsRoot;
  private readonly librariesBase;
  private readonly versionsBase;
  private readonly modsRoot;
  private readonly resourcePacksRoot;
  private readonly shaderPacksRoot;
  private readonly savesRoot;
  private readonly log4j2Root;
  private readonly tempFileRoot;
  private readonly dynamicModsRoot;

  getModJar(modJar: string): string {
    return path.resolve(this.getModsRoot(), modJar);
  }

  getNativesLocation(id: string): string {
    return path.resolve(this.rootDir, "versions", id, "natives");
  }

  getVersionBase(): string {
    return path.resolve(this.versionsBase);
  }

  getAssetsRootLegacy(): string {
    return path.resolve(this.assetsRoot, "legacy");
  }
  getPff2LockFile(): string {
    return path.resolve(this.rootDir, "pff2.lock");
  }
  getTempFileStorePath(relativePath: string): string {
    return path.resolve(this.tempFileRoot, relativePath);
  }

  getNativeLibraryExtractedRoot(library: LibraryMeta): string {
    const nativeLibraryPath = getNativeArtifact(library).path;
    return path.resolve(
      this.getLibraryPath(
        path.join(
          path.dirname(nativeLibraryPath),
          path.basename(nativeLibraryPath, JAR_SUFFIX)
        )
      )
    );
  }

  getLog4j2FilePath(xmlName: string): string {
    return path.resolve(this.log4j2Root, xmlName);
  }

  getAssetsIndexPath(index: string): string {
    return path.resolve(this.assetsRoot, "indexes", index + ".json");
  }

  getAssetPathLegacy(name: string): string {
    return path.resolve(this.assetsRoot, "legacy", name);
  }

  getAssetPath(hash: string): string {
    const header = hash.slice(0, 2);
    return path.resolve(this.assetsRoot, "objects", header, hash);
  }

  getSavesRoot(): string {
    return this.savesRoot;
  }

  getResourcePacksRoot(): string {
    return this.resourcePacksRoot;
  }

  getShaderPacksRoot(): string {
    return this.shaderPacksRoot;
  }

  getModsRoot(): string {
    return this.modsRoot;
  }

  getAssetsRoot(): string {
    return this.assetsRoot;
  }

  getVersionRoot(id: string): string {
    return path.resolve(this.versionsBase, id);
  }

  getProfilePath(id: string): string {
    return path.resolve(this.getVersionRoot(id), id + ".json");
  }

  getClientPath(id: string): string {
    return path.resolve(this.getVersionRoot(id), id + ".jar");
  }

  getLibraryPath(libPath: string): string {
    return path.resolve(this.librariesBase, libPath);
  }

  getLibrariesRoot(): string {
    return this.librariesBase;
  }

  resolvePath(relativePath?: string): string {
    return path.resolve(this.rootDir, relativePath || "");
  }

  getDynamicModsRoot(): string {
    return this.dynamicModsRoot;
  }

  getDynamicModJar(modJar: string): string {
    return path.resolve(this.getDynamicModsRoot(), modJar);
  }

  constructor(rootDir: string, id: string) {
    this.id = id;
    this.rootDir = rootDir;
    this.assetsRoot = this.resolvePath("assets");
    this.librariesBase = this.resolvePath("libraries");
    this.versionsBase = this.resolvePath("versions");
    this.modsRoot = this.resolvePath("mods");
    this.resourcePacksRoot = this.resolvePath("resourcepacks");
    this.shaderPacksRoot = this.resolvePath("shaderpacks");
    this.savesRoot = this.resolvePath("saves");
    this.log4j2Root = this.resolvePath("log4j2-xml");
    this.tempFileRoot = this.resolvePath("alicorn-temp");
    this.dynamicModsRoot = this.resolvePath("alicorn-mods-dyn");
  }
}
