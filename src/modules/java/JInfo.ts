import path from "path";
import fs from "fs-extra";
import { loadProperties } from "../commons/PropertiesUtil";
import os from "os";
import { ALICORN_DATA_SUFFIX, PLACE_HOLDER } from "../commons/Constants";
import { loadData, saveDataSync } from "../config/DataSupport";
import { buildMap, parseMap } from "../commons/MapUtil";

// UNCHECKED

const JAVA_RECORD_BASE = "java.record" + ALICORN_DATA_SUFFIX;
const JAVA_RELEASE = "release";
const LATEST_TAG = "?LATEST>>";
let JDT = new Map<string, string>();
const JAVA = (() => {
  if (os.platform() === "win32") {
    return path.join("bin", "java.exe");
  } else {
    return path.join("bin", "java");
  }
})();
const CACHE_MAP = new Map<string, Map<string, string>>();

export async function getJavaInfoSummary(
  jHome: string,
  reload = false
): Promise<JRESummary> {
  return generateSummaryInfo(await getJavaInfoRaw(jHome, reload));
}

export async function getJavaInfoRaw(
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
  return path.resolve(path.join(jHome, JAVA));
}

// FIXME Only for emergency
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
  return JDT.get(LATEST_TAG) || getAllJava()[0] || "";
}

export function setLastUsedJavaHome(jHome: string): void {
  JDT.set(LATEST_TAG, jHome);
}

export function saveJDTSync(): void {
  saveDataSync(JAVA_RECORD_BASE, buildMap(JDT));
}

export interface JRESummary {
  semanticVersion: string;
  javaVersion: string;
  jvmType: string;
  jvmVersion: string;
  implementor: string;
}

function generateSummaryInfo(ji: Map<string, string>): JRESummary {
  return {
    semanticVersion: String(ji.get("SEMANTIC_VERSION") || ""),
    javaVersion: String(ji.get("JAVA_VERSION") || ""),
    jvmType: String(ji.get("JVM_VARIANT") || ""),
    jvmVersion: String(ji.get("JVM_VERSION") || ""),
    implementor: String(ji.get("IMPLEMENTOR") || ""),
  };
}
