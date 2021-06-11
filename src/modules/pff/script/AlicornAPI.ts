import { MinecraftContainer } from "../../container/MinecraftContainer";
import pkg from "../../../../package.json";
import path from "path";
import { copyFile } from "fs-extra";

export interface AlicornAPI {
  getVersion: () => string;
  getTarget: () => MinecraftContainer;
  getPackage: () => InstallerPackage;
  copyFile: (from: string, to: string) => Promise<void>;
}

interface InstallerPackage {
  getFile: (f: string) => string;
}

class SimpleAlicornAPI implements AlicornAPI {
  private readonly container: MinecraftContainer;
  private readonly package: SimpleInstallerPackage;

  constructor(containerRoot: string, packageRoot: string) {
    this.container = new MinecraftContainer(containerRoot, "Virtual");
    this.package = new SimpleInstallerPackage(packageRoot);
  }

  getVersion(): string {
    return pkg.appVersion;
  }

  getTarget(): MinecraftContainer {
    return this.container;
  }

  getPackage(): InstallerPackage {
    return this.package;
  }

  async copyFile(from: string, to: string): Promise<void> {
    await copyFile(from, to);
  }
}

class SimpleInstallerPackage implements InstallerPackage {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  getFile(f: string): string {
    const t = path.join(this.rootDir, f);
    if (isSafeInDir(this.rootDir, t)) {
      return t;
    }
    throw new Error(
      "Invalid access! You should not try to access a file outside the sandbox!"
    );
  }
}

function isSafeInDir(base: string, target: string): boolean {
  base = path.resolve(base);
  target = path.resolve(target);
  const d = path.relative(base, target);
  if (d.split(path.sep).includes("..")) {
    return false;
  }
  return !path.isAbsolute(d);
}
