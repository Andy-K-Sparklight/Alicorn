import childProcess from "child_process";
import os from "os";
import path from "path";
import { ALICORN_DATA_SUFFIX, PLACE_HOLDER } from "../commons/Constants";
import { isFileExist } from "../commons/FileUtil";
import { buildMap, parseMap } from "../commons/MapUtil";
import { loadData, saveData, saveDataSync } from "../config/DataSupport";

const JAVA_RECORD_BASE = "java.record" + ALICORN_DATA_SUFFIX;
const LATEST_TAG = "?LATEST>>";
let JDT = new Map<string, string>();
const JAVA = (() => {
  if (os.platform() === "win32") {
    return path.join("bin", "java.exe");
  } else {
    return path.join("bin", "java");
  }
})();
const JAVA_ORACLE = path.join("javapath", "java.exe");

const JAVA_INFO_CACHE: Map<string, string> = new Map();

export async function getJavaInfoRaw(jHome: string): Promise<string> {
  const p = await getJavaRunnable(jHome, false);
  if (p === "") {
    return "";
  }
  const jRPath = path.resolve(p);
  if (JAVA_INFO_CACHE.has(jRPath)) {
    return JAVA_INFO_CACHE.get(jRPath) || "";
  }
  return new Promise<string>((resolve, reject) => {
    childProcess.execFile(jRPath, ["-version"], (e, stdout, stderr) => {
      if (e) {
        reject();
      } else {
        if (stdout.trim().length > 0) {
          JAVA_INFO_CACHE.set(jRPath, stdout);
          resolve(stdout);
        } else if (stderr.trim().length > 0) {
          JAVA_INFO_CACHE.set(jRPath, stderr);
          resolve(stderr);
        } else {
          reject();
        }
      }
    });
  });
}

export async function getJavaRunnable(
  jHome: string,
  useName = true
): Promise<string> {
  const p1 = path.resolve(path.join(jHome, JAVA));
  if (!(await isFileExist(p1))) {
    const p2 = path.resolve(path.join(jHome, JAVA_ORACLE));
    if (!(await isFileExist(p2))) {
      return useName ? "java" : "";
    }
    return p2;
  }
  return p1;
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

export function resetJavaList(list: string[]): void {
  const lt = JDT.get(LATEST_TAG) || "";
  JDT.clear();
  for (const h of list) {
    JDT.set(h, PLACE_HOLDER);
  }
  if (JDT.has(lt)) {
    JDT.set(LATEST_TAG, lt);
  } else {
    JDT.set(LATEST_TAG, "");
  }
}

export function getDefaultJavaHome(): string {
  return JDT.get(LATEST_TAG) || getAllJava()[0] || "";
}

export function setDefaultJavaHome(jHome: string): void {
  JDT.set(LATEST_TAG, jHome);
}

export function saveJDTSync(): void {
  saveDataSync(JAVA_RECORD_BASE, buildMap(JDT));
}

export async function saveJDT(): Promise<void> {
  await saveData(JAVA_RECORD_BASE, buildMap(JDT));
}

export function parseJavaInfoRaw(ji: string): {
  spec: string;
  runtime: string;
  vm: string;
} {
  const a = ji.split(os.EOL);
  return {
    spec: a[0] || "",
    runtime: a[1] || "",
    vm: a[2] || "",
  };
}

const VERSION_MATCH = /(?<=["'])[0-9._\-a-z]+?(?=["'])/i;
const JAVA_9E_MATCH = /(?<=1\.)[0-9](?=.*)/i;
const JAVA_NEW_MATCH = /^[0-9]{2,}(?=[.-]+?)/i;
const BITS_32 = /32-bit/i;
const CLIENT_SIDE = /client\.*vm/i;
const OPEN_JDK = /openjdk/i;

export interface JavaInfo {
  rootVersion: number;
  version: string;
  vm: string;
  vmSide: "Client" | "Server";
  bits: "32" | "64";
  runtime: string;
  isFree: boolean;
}

export function parseJavaInfo(ji: {
  spec: string;
  runtime: string;
  vm: string;
}): JavaInfo {
  let ev: string;
  const v = ji.spec.match(VERSION_MATCH);
  if (!v) {
    ev = "Unknown";
  } else {
    ev = v[0];
  }
  let bv = 0;
  if (JAVA_NEW_MATCH.test(ev)) {
    bv = parseInt((ev.match(JAVA_NEW_MATCH) || ["0"])[0]);
  } else if (JAVA_9E_MATCH.test(ev)) {
    bv = parseInt((ev.match(JAVA_9E_MATCH) || ["0"])[0]);
  }
  return {
    rootVersion: bv,
    version: ev,
    vm: ji.vm,
    vmSide: CLIENT_SIDE.test(ji.vm) ? "Client" : "Server",
    bits: BITS_32.test(ji.vm) ? "32" : "64",
    runtime: ji.runtime,
    isFree: OPEN_JDK.test(ji.runtime),
  };
}

export async function getLegacyJDK(): Promise<string | undefined> {
  try {
    const df = getDefaultJavaHome();
    if (
      parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(df))).rootVersion ===
      8
    ) {
      return df;
    }
  } catch {}

  for (const c of getAllJava()) {
    try {
      if (
        parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(c))).rootVersion ===
        8
      ) {
        return c;
      }
    } catch {}
  }
}

export async function getNewJDK(version = 16): Promise<string | undefined> {
  try {
    const df = getDefaultJavaHome();
    if (
      parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(df))).rootVersion >=
      version
    ) {
      return df;
    }
  } catch {}

  for (const c of getAllJava()) {
    try {
      if (
        parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(c))).rootVersion >=
        version
      ) {
        return c;
      }
    } catch {}
  }
}

export async function preCacheJavaInfo(): Promise<void> {
  await Promise.allSettled(
    getAllJava().map(async (j) => {
      await getJavaInfoRaw(j);
    })
  );
}
