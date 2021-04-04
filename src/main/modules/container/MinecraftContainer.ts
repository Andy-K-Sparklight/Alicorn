import path from "path";
import { LibraryMeta } from "../profile/Meta";
import { getNativeArtifact, JAR_SUFFIX } from "../launch/NativesLint";

export class MinecraftContainer {
  id = "";
  rootDir = "";
  private readonly assetsRoot;
  private readonly nativesBase;
  private readonly librariesBase;
  private readonly versionsBase;
  private readonly modsRoot;
  private readonly resourcePacksRoot;
  private readonly shaderPacksRoot;
  private readonly logsRoot;
  private readonly crashReportsRoot;
  private readonly savesRoot;
  private readonly log4j2Root;
  private readonly tempFileRoot;

  getGlobalLog4j2Root(): string {
    return this.log4j2Root;
  }

  getVersionBase(): string {
    return path.resolve(this.versionsBase);
  }

  getTempFileStorePath(relativePath: string): string {
    return path.resolve(path.join(this.tempFileRoot, relativePath));
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
    return path.resolve(path.join(this.log4j2Root, xmlName));
  }

  getGlobalVersionsRoot(): string {
    return this.versionsBase;
  }

  getAssetsIndexPath(index: string): string {
    return path.resolve(path.join(this.assetsRoot, "indexes", index + ".json"));
  }

  getAssetPath(hash: string): string {
    const header = hash.slice(0, 2);
    return path.resolve(path.join(this.assetsRoot, "objects", header, hash));
  }

  getSavesRoot(): string {
    return this.savesRoot;
  }

  getLogsRoot(): string {
    return this.logsRoot;
  }

  getCrashReportsRoot(): string {
    return this.crashReportsRoot;
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
    return path.resolve(path.join(this.versionsBase, id));
  }

  getProfilePath(id: string): string {
    return path.resolve(path.join(this.getVersionRoot(id), id + ".json"));
  }

  getClientJarPath(id: string): string {
    return path.resolve(path.join(this.getVersionRoot(id), id + ".jar"));
  }

  getLibraryPath(libPath: string): string {
    return path.resolve(path.join(this.librariesBase, libPath));
  }

  getLibrariesRoot(): string {
    return this.librariesBase;
  }

  getGlobalNativesRoot(): string {
    return this.nativesBase;
  }

  resolvePath(relativePath?: string): string {
    return path.resolve(path.join(this.rootDir, relativePath || ""));
  }

  constructor(rootDir: string, id: string) {
    this.id = id;
    this.rootDir = rootDir;
    this.assetsRoot = this.resolvePath("assets");
    this.nativesBase = this.resolvePath("$natives");
    this.librariesBase = this.resolvePath("libraries");
    this.versionsBase = this.resolvePath("versions");
    this.modsRoot = this.resolvePath("mods");
    this.resourcePacksRoot = this.resolvePath("resourcepacks");
    this.shaderPacksRoot = this.resolvePath("shaderpacks");
    this.logsRoot = this.resolvePath("logs");
    this.crashReportsRoot = this.resolvePath("crash-reports");
    this.savesRoot = this.resolvePath("saves");
    this.log4j2Root = this.resolvePath("log4j2-xml");
    this.tempFileRoot = this.resolvePath("alicorn-temp");
  }
}
