import os from "os";
import childProcess from "child_process";
import fs from "fs-extra";
import path from "path";

// This function is VERY SLOW!
// It searches the whole os directory to find 'javaw.exe'(or 'javaw' on unix-liked)

export async function WhereJava(): Promise<string[]> {
  let all: string[] = [];
  all = all.concat(await findJavaViaCommand());
  all.push(await findJavaInPATH());
  if (os.platform() === "win32") {
    all = all.concat(await findJavaInProgramFilesWin32());
  } else {
    all = all.concat(await findJavaUNIX());
  }
  const res: string[] = [];

  for (const a of all) {
    const trimA = path.resolve(path.dirname(path.dirname(a.trim())));
    if (trimA !== "" && !res.includes(trimA)) {
      res.push(trimA);
      // Get Java home
    }
  }
  return res;
}

async function findJavaUNIX(): Promise<string[]> {
  if (os.platform() === "win32") {
    return [];
  }
  const programBase = "/";
  const all: string[] = [];
  await diveSearch("javaw", programBase, all);
  return all;
}

async function findJavaInPATH(): Promise<string> {
  const javaPath = process.env["JAVA_HOME"];
  if (javaPath === undefined) {
    return "";
  }
  let javaName = "javaw";
  if (os.platform() === "win32") {
    javaName = "javaw.exe";
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

  await diveSearch("javaw.exe", programBaseMain, all);
  await diveSearch("javaw.exe", programBase86, all);
  // Find 32 bit, diveSearch can 'afford' error
  return all;
}

// Use command to locate
async function findJavaViaCommand(): Promise<string[]> {
  let command = "which javaw";
  if (os.platform() === "win32") {
    command = "where javaw";
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
  concatArray: string[]
): Promise<void> {
  try {
    const all = await fs.readdir(rootDir);
    if (all.includes(fileName)) {
      concatArray.push(path.resolve(rootDir, fileName));
    }
    for (const f of all) {
      const currentBase = path.resolve(rootDir, f);
      if ((await fs.stat(currentBase)).isDirectory()) {
        await diveSearch(fileName, currentBase, concatArray);
      }
    }
  } catch {
    return;
  }
}
