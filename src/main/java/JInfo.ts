import path from "path";
import fs from "fs-extra";
import { loadProperties } from "../commons/PropertiesUtil";
import os from "os";
import { ALICORN_DATA_SUFFIX, PLACE_HOLDER } from "../commons/Constants";
import { loadData, saveData } from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";

// UNCHECKED

const JAVA_RECORD_BASE = "java.record" + ALICORN_DATA_SUFFIX;
const JAVA_RELEASE = "release";
const LATEST_TAG = "?LATEST>>";
let JDT = new Map<string, string>();
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

export async function loadJDT(): Promise<void> {
  JDT = parseMap(await loadData(JAVA_RECORD_BASE));
}

export function getAllJava(): string[] {
  const lt = JDT.get(LATEST_TAG) || "";
  JDT.delete(LATEST_TAG);
  const res = Array.from(JDT.keys());
  JDT.set(LATEST_TAG, lt);
  return res;
}

export function removeJava(jHome: string): void {
  JDT.delete(jHome);
}

export function addJava(jHome: string): void {
  JDT.set(jHome, PLACE_HOLDER);
}

export function getLastUsedJavaHome(): string {
  return JDT.get(LATEST_TAG) || "";
}

export function setLastUsedJavaHome(jHome: string): void {
  JDT.set(LATEST_TAG, jHome);
}

export async function saveJDT(): Promise<void> {
  await saveData(JAVA_RECORD_BASE, buildMap(JDT));
}
