import os from "os";
import childProcess from "child_process";
import fs from "fs-extra";
import path from "path";

export async function whereJava(): Promise<string[]> {
  let all: string[] = [];
  all = all
    .concat(await findJavaViaCommand())
    .concat(await findJavaInProgramFilesWin32())
    .concat(await findJavaUNIX());
  all.push(await findJavaInPATH());
  const res: string[] = [];
  for (const a of all) {
    const trimA = a.trim();
    if (trimA !== "" && !res.includes(trimA)) {
      res.push(a);
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
  const programBase = "C:\\Program Files";
  const all: string[] = [];
  await diveSearch("javaw.exe", programBase, all);
  return all;
}

async function findJavaViaCommand(): Promise<string[]> {
  let command = "which javaw";
  if (os.platform() === "win32") {
    command = "where javaw";
  }
  return await new Promise<string[]>((resolve, reject) => {
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
          reject();
        }
      }
    );
  });
}

async function diveSearch(
  fileName: string,
  rootDir: string,
  concatArray: string[]
) {
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

    // eslint-disable-next-line no-empty
  } catch {}
}
