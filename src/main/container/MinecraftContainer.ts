import { Container } from "./Container";
import path from "path";

// TODO more support

export class MinecraftContainer extends Container {
  private assetsRoot = this.resolvePath("assets");
  private nativesBase = this.resolvePath("$natives");
  private librariesBase = this.resolvePath("libraries");
  private versionsBase = this.resolvePath("versions");
  private modsRoot = this.resolvePath("mods");
  private resourcePacksRoot = this.resolvePath("resourcepacks");
  private shaderPacksRoot = this.resolvePath("shaderpacks");
  private logsRoot = this.resolvePath("logs");
  private crashReportsRoot = this.resolvePath("crash-reports");
  private savesRoot = this.resolvePath("saves");
  private log4j2Root = this.resolvePath("log4j2-xml");

  getGlobalLog4j2Root(): string {
    return this.log4j2Root;
  }

  getLog4j2FilePath(xmlName: string): string {
    return path.resolve(path.join(this.log4j2Root, xmlName));
  }

  getGlobalVersionsRoot(): string {
    return this.versionsBase;
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

  getNativesRoot(id: string): string {
    return path.resolve(path.join(this.nativesBase, id));
  }

  resolvePath(relativePath: string): string {
    return path.resolve(path.join(this.rootDir, relativePath));
  }

  constructor(rootDir: string, containerID: string) {
    super(rootDir, containerID);
  }
}
