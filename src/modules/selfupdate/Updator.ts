import Ajv from "ajv";
import { tgz, zip } from "compressing";
import fs from "fs-extra";
import os from "os";
import path from "path";
import pkg from "../../../package.json";
import { submitInfo, submitSucc, submitWarn } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { getString } from "../config/ConfigSupport";
import { getActualDataPath } from "../config/DataSupport";
import { getBasePath } from "../config/PathSolve";
import { DownloadMeta } from "../download/AbstractDownloader";
import { Serial } from "../download/Serial";
import BuildInfoSchema from "./BuildInfoSchema.json";
// MAINTAINERS ONLY

let BASE_URL: string;
let RELEASE_FOLDER: string;
let MAIN_BUILD_FILE_RELEASE: string;
let RENDERER_BUILD_FILE_RELEASE: string;
let LOCK_FILE: string;
let IS_UPDATING = false;
let func: (() => unknown) | null = null;

export function initUpdator(lv?: number): void {
    BASE_URL = getString(
        "updator.url",
        `https://cdn.jsdelivr.net/gh/Andy-K-Sparklight/Alicorn@${
            lv || pkg.updatorVersion + 1
        }/`,
        true
    ).replace("${version}", (lv || pkg.updatorVersion + 1).toString());
    RELEASE_FOLDER = BASE_URL + "release/";
    MAIN_BUILD_FILE_RELEASE = RELEASE_FOLDER + "MainBuild.json";
    RENDERER_BUILD_FILE_RELEASE = RELEASE_FOLDER + "RendererBuild.json";
    LOCK_FILE = getActualDataPath("install.lock");
}

interface BuildInfo {
    date: string;
    files: string[];
    version: string;
}

export function waitUpdateFinished(f: () => unknown): void {
    if (!IS_UPDATING) {
        f();
    } else {
        console.log("Hook attached, waiting for update finish...");
        func = f;
    }
}

function notifyAll(): void {
    if (func) {
        console.log("Update finished, calling hooks...");
        func();
    }
}

const AJV = new Ajv();

export async function checkUpdate(): Promise<void> {
    try {
        if (os.platform() === "darwin") {
            // macOS updates isn't supported yet
            console.log("Skipped update checking due to unsupported platform.");
            return;
        }
        console.log("Start checking updates!");
        const lv = await findLatestCanUpdateVersion();
        console.log("Latest can update version is " + lv);
        initUpdator(lv);
        if (lv <= pkg.updatorVersion) {
            console.log(
                "You are running the latest version! (Latest Equals To Current)"
            );
            return;
        }
        const HEAD = MAIN_BUILD_FILE_RELEASE;
        console.log("HEAD is " + MAIN_BUILD_FILE_RELEASE);
        const BASE = RELEASE_FOLDER;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let res: any;
        console.log("Fetching version info...");
        try {
            res = await (
                await fetch(HEAD, {
                    method: "GET",
                    cache: "no-cache",
                    credentials: "omit"
                })
            ).json();
            console.log("Fetched a manifest.");
        } catch (e) {
            if (String(e).includes("404") || String(e).includes("SyntaxError")) {
                console.log(
                    "You are running the latest version! (404 / No Later File)"
                );
                return;
            }
            throw e;
        }
        console.log("Validating build info!");
        let d: BuildInfo;
        if (AJV.validate(BuildInfoSchema, res)) {
            d = res as BuildInfo;
            console.log("Validate passed.");
            console.log(
                "This update is released at " + new Date(d.date).toLocaleString()
            );
            console.log("Fetching extra manifest...");
            const res_rend = await (
                await fetch(RENDERER_BUILD_FILE_RELEASE, {
                    method: "GET",
                    credentials: "omit",
                    cache: "no-cache"
                })
            ).json();
            if (!AJV.validate(BuildInfoSchema, res_rend)) {
                console.log("Invalid build info! Skipped updating this time.");
                return;
            }
            submitInfo(tr("System.HasUpdate"));
            console.log("Downloading files...");
            if (!(await doUpdate(BASE, res_rend as BuildInfo))) {
                console.log("Update failed, let's try again next time.");
                return;
            }
            if (!(await doUpdate(BASE, res as BuildInfo))) {
                console.log("Update failed, let's try again next time.");
                return;
            }
            console.log("Switching files...");
            IS_UPDATING = true;
            try {
                await switchFile();
            } catch (e) {
                console.log(e);
                console.log("File switch failed! Error is present above.");
                IS_UPDATING = false;
                notifyAll();
            }
            await fs.ensureDir(path.dirname(LOCK_FILE));
            await fs.outputFile(LOCK_FILE, (res as BuildInfo).date, {mode: 0o777});
            console.log("Update completed.");
            submitSucc(tr("System.UpdateOK"));
            IS_UPDATING = false;
            notifyAll();
            // await hintUpdate(u); We have a page to show update
        } else {
            console.log("Invalid build info! Skipped updating this time.");
            IS_UPDATING = false;
            notifyAll();
        }
    } catch (e) {
        console.log("Precaught error during updating!");
        console.log(e);
        IS_UPDATING = false;
        notifyAll();
        throw e;
    }
}

async function findLatestCanUpdateVersion(): Promise<number> {
    let target = pkg.updatorVersion + 1;
    let bu = getString(
        "updator.url",
        `https://cdn.jsdelivr.net/gh/Andy-K-Sparklight/Alicorn@${target}/release/MainBuild.json`,
        true
    ).replace("${version}", target.toString());
    console.log("Checking version " + target);
    let status = true;
    while (status) {
        try {
            status =
                (
                    await fetch(bu, {
                        method: "GET",
                        cache: "no-cache",
                        credentials: "omit"
                    })
                ).status === 200;
        } catch {
            status = false;
        }
        if (status) {
            target++;
            bu = getString(
                "updator.url",
                `https://cdn.jsdelivr.net/gh/Andy-K-Sparklight/Alicorn@${target}/release/MainBuild.json`,
                true
            ).replace("${version}", target.toString());
        }
    }
    return target - 1;
}

async function doUpdate(baseUrl: string, info: BuildInfo): Promise<boolean> {
    try {
        const basePath = getBasePath();
        const targetPath = basePath + ".local";
        const o: Promise<void>[] = [];
        for (const v of info.files) {
            console.log("Downloading " + v);
            const target = path.resolve(targetPath, v);
            // First download all, then rename
            const meta = new DownloadMeta(baseUrl + v, target, "");
            o.push(
                (async () => {
                    let tries = 0;
                    while (tries < 3) {
                        const s = await Serial.getInstance().downloadFile(meta, true, true);
                        if (s === 1) {
                            return;
                        }
                        tries++;
                    }
                    throw "Failed to download: " + v;
                })()
            );
        }
        await Promise.all(o);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

async function switchFile(): Promise<boolean> {
    try {
        const basePath = getBasePath();
        const originPath = basePath + ".local";
        await fs.remove(basePath);
        await fs.rename(originPath, basePath);
        return true;
    } catch (e) {
        return false;
    }
}

export async function updateFromSource(file: string): Promise<void> {
    try {
        submitInfo(tr("System.HasUpdate"));
        const appPath = getBasePath();
        const resources = path.dirname(appPath);
        await fs.rename(appPath, path.join(resources, "app-local"));
        const unZipTarget = path.join(resources, "app-temp");
        await fs.emptyDir(unZipTarget);
        await fs.emptyDir(appPath);
        try {
            await zip.uncompress(file, unZipTarget);
        } catch {
            await tgz.uncompress(file, unZipTarget);
        }
        const dirs = await fs.readdir(unZipTarget);
        const tD = dirs[0];
        if (tD) {
            await fs.copy(path.join(unZipTarget, tD, "release"), appPath);
            await fs.remove(path.join(resources, "app-local"));
            await fs.remove(unZipTarget);
        }
        submitSucc(tr("System.UpdateOK"));
    } catch (e) {
        console.log(e);
        submitWarn(tr("System.UpdateFailed"));
    }
}
