import childProcess from "child_process";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { isFileExist } from "../commons/FileUtil";
import { getBoolean, getNumber } from "../config/ConfigSupport";

// This function is VERY SLOW!
// It searches the whole os directory to find 'java.exe'(or 'java' on unix-liked)

export async function whereJava(): Promise<string[]> {
  let all: string[] = [];
  all = all.concat(await findJavaViaCommand());
  all.push(await findJavaInPATH());
  if (!getBoolean("java.simple-search")) {
    if (os.platform() === "win32") {
      all = all.concat(await findJavaInProgramFilesWin32());
    } else {
      all = all.concat(await findJavaUNIX());
    }
  }
  const res: string[] = [];

  for (const a of all) {
    if (await isFileExist(a)) {
      const trimA = path.resolve(path.dirname(path.dirname(a.trim())));
      if (trimA !== "" && !res.includes(trimA)) {
        res.push(trimA);
        // Get Java home
      }
    }
  }
  return res;
}

async function findJavaUNIX(): Promise<string[]> {
  if (os.platform() === "win32") {
    return [];
  }
  console.log("Searching Java!");
  const programBase = "/";
  const all: string[] = [];
  await diveSearch("java", programBase, all, getNumber("java.search-depth", 8));
  return all;
}

async function findJavaInPATH(): Promise<string> {
  const javaPath = process.env["JAVA_HOME"];
  if (javaPath === undefined) {
    return "";
  }
  let javaName = "java";
  if (os.platform() === "win32") {
    javaName = "java.exe";
  }
  const testJavaPath = path.join(javaPath, "bin", javaName);
  if (fs.existsSync(testJavaPath)) {
    return testJavaPath;
  }
  return "";
}

async function findJavaInProgramFilesWin32(): Promise<string[]> {
  if (os.platform() !== "win32") {
    return [];
  }
  const programBaseMain = "C:\\Program Files";
  const programBase86 = "C:\\Program Files (x86)";
  const all: string[] = [];

  await diveSearch(
    "java.exe",
    programBaseMain,
    all,
    getNumber("java.search-depth", 8)
  );
  await diveSearch(
    "java.exe",
    programBase86,
    all,
    getNumber("java.search-depth", 8)
  );
  // Find 32 bit, diveSearch can 'afford' error
  return all;
}

const DIR_BLACKLIST = [
  "proc",
  "etc",
  "node_modules",
  "tmp",
  "dev",
  "sys",
  "drivers",
  "var",
  "src",
  "config",
  "lib",
  "icons",
  ".npm",
  "cache",
];

// Use command to locate
async function findJavaViaCommand(): Promise<string[]> {
  let command = "which java";
  if (os.platform() === "win32") {
    command = "where java";
  }
  return await new Promise<string[]>((resolve) => {
    childProcess.exec(
      command,
      {
        cwd: os.homedir(),
      },
      (error, stdout) => {
        if (!error) {
          const result = [];
          const resultRaw = stdout.split(os.EOL);
          for (const r of resultRaw) {
            const trimR = r.trim();
            if (trimR !== "") {
              result.push(trimR);
            }
          }
          resolve(result);
        } else {
          resolve([]);
        }
      }
    );
  });
}

// SLOW reclusive function
async function diveSearch(
  fileName: string,
  rootDir: string,
  concatArray: string[],
  depth = 8,
  counter = 0
): Promise<void> {
  console.log("Searching " + rootDir);
  if (depth !== 0 && counter > depth) {
    return;
  }
  try {
    const all = await fs.readdir(rootDir);
    if (all.includes(fileName)) {
      concatArray.push(path.resolve(rootDir, fileName));
    }
    for (const f of all) {
      if (DIR_BLACKLIST.includes(f.toLowerCase())) {
        continue;
      }
      const currentBase = path.resolve(rootDir, f);
      if ((await fs.stat(currentBase)).isDirectory()) {
        await diveSearch(
          fileName,
          currentBase,
          concatArray,
          depth,
          counter + 1
        );
      }
    }
  } catch {
    return;
  }
}
