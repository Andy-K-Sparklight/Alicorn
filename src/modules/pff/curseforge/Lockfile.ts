import path from "path";
import { LOCK_FILE } from "./Values";
import fs from "fs-extra";
import Yaml from "js-yaml";

export async function loadLockFile(dir: string): Promise<Record<string, Mod>> {
  const target = path.resolve(dir, LOCK_FILE);
  try {
    const content = (await fs.readFile(target)).toString();
    const f = Yaml.load(content, { filename: target, json: true });
    if (f !== null && typeof f === "object") {
      return f as Record<string, Mod>;
    } else {
      return {};
    }
  } catch {
    return {};
  }
}

export interface Package {
  addonId: string;
  fileId: string;
  hashCode: string;
  downloadURL: string;
  gameVersions: string[];
  dependencies: Package[];
  installDate: Date;
}

export interface Mod {
  displayName: string;
  slug: string;
  addonId: string;
  packages: Record<string, Package>;
}
