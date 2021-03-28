import path from "path";
import fs from "fs-extra";
import { loadProperties } from "../commons/PropertiesUtil";
import os from "os";

const JAVA_RELEASE = "release";
const JAVAW = (() => {
  if (os.platform() === "win32") {
    return path.join("bin", "javaw.exe");
  } else {
    return path.join("bin", "javaw");
  }
})();
const CACHE_MAP = new Map<string, Map<string, string>>();

export async function getJavaInfo(
  jHome: string,
  reload = false
): Promise<Map<string, string>> {
  const jRPath = path.resolve(path.join(jHome, JAVA_RELEASE));
  if (!reload) {
    if (CACHE_MAP.has(jRPath)) {
      return CACHE_MAP.get(jRPath) || new Map<string, string>();
    }
  }
  const releaseContent = (await fs.readFile(jRPath)).toString();
  const rMap = loadProperties(releaseContent);
  CACHE_MAP.set(jRPath, rMap);
  return rMap;
}

export function getJavaRunnable(jHome: string): string {
  return path.resolve(path.join(jHome, JAVAW));
}
