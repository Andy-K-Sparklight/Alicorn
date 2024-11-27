import childProcess from "child_process";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { invokeWorker } from "@/renderer/Schedule";
import { isFileExist } from "../commons/FileUtil";
import { getBoolean, getNumber } from "../config/ConfigSupport";
import { resetJavaList } from "./JavaInfo";

// This function is VERY SLOW!
// It searches the whole os directory to find 'java.exe'(or 'java' on unix-liked)

export async function whereJava(
    useCache = false,
    justExist = false
): Promise<string[]> {
    let all: string[] = [];
    all = all.concat(await findJavaViaCommand());
    all.push(findJavaInPATH());
    if (justExist && all.length > 0) {
        const p = await chkJava(all);
        if (p.length > 0) {
            return p;
        }
    }
    if (!getBoolean("java.simple-search")) {
        if (os.platform() === "win32") {
            all = all.concat(await findJavaInProgramFilesWin32(justExist));
        } else {
            all = all.concat(await findJavaUNIX(justExist));
        }
    }

    const res = await chkJava(all);

    if (useCache) {
        resetJavaList(res);
    }
    return res;
}

async function chkJava(all: string[]): Promise<string[]> {
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

async function findJavaUNIX(any = false): Promise<string[]> {
    if (os.platform() === "win32") {
        return [];
    }
    const programBase = "/usr/";
    const all: string[] = [];
    await diveSearch(
        "java",
        programBase,
        all,
        getNumber("java.search-depth", 8),
        0,
        any
    );
    return all;
}

function findJavaInPATH(): string {
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

async function findJavaInProgramFilesWin32(any = false): Promise<string[]> {
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
        getNumber("java.search-depth", 5),
        0,
        any
    );
    await diveSearch(
        "java.exe",
        programBase86,
        all,
        getNumber("java.search-depth", 5),
        0,
        any
    );
    // Find 32 bit, diveSearch can 'afford' error
    return all;
}

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
                cwd: os.homedir()
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

async function diveSearch(
    fileName: string,
    rootDir: string,
    concatArray: string[],
    depth = 5,
    counter = 0,
    any = false
): Promise<void> {
    const res = await invokeWorker(
        "DiveSearch",
        fileName,
        rootDir,
        depth,
        counter,
        any
    );
    if (res instanceof Array) {
        res.forEach((s) => {
            concatArray.push(s);
        });
    }
}
