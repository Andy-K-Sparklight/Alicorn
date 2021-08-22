import Ajv from "ajv";
import fs from "fs-extra";
import got from "got";
import os from "os";
import path from "path";
import pkg from "../../../package.json";
import { getString } from "../config/ConfigSupport";
import { getActualDataPath } from "../config/DataSupport";
import { getBasePath } from "../config/PathSolve";
import { DownloadMeta } from "../download/AbstractDownloader";
import { getProxyAgent } from "../download/ProxyConfigure";
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
export function initUpdator(): void {
  BASE_URL = getString(
    "updator.url",
    `https://cdn.jsdelivr.net/gh/Andy-K-Sparklight/Alicorn@${
      pkg.updatorVersion + 1
    }/`,
    true
  ).replace("${version}", (pkg.updatorVersion + 1).toString());
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
    func = f;
  }
}

function notifyAll(): void {
  if (func) {
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
    IS_UPDATING = true;
    const HEAD = MAIN_BUILD_FILE_RELEASE;
    console.log("HEAD is " + MAIN_BUILD_FILE_RELEASE);
    const BASE = RELEASE_FOLDER;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: any;
    console.log("Fetching version info...");
    try {
      res = await got.get(HEAD, {
        https: {
          rejectUnauthorized: false,
        },
        responseType: "json",
        agent: getProxyAgent(),
      });
      console.log("Fetched a manifest.");
    } catch (e) {
      if (String(e).includes("404")) {
        console.log(
          "You are running the latest version! (404 / No Later File)"
        );
        IS_UPDATING = false;
        notifyAll();
        return;
      }
      IS_UPDATING = false;
      notifyAll();
      throw e;
    }
    console.log("Validating build info!");
    let d: BuildInfo;
    if (AJV.validate(BuildInfoSchema, res.body)) {
      d = res.body as BuildInfo;
      console.log("Validate passed.");
      /*
      if (await isFileExist(LOCK_FILE)) {
        if (
          new Date((await fs.readFile(LOCK_FILE)).toString()) >=
          new Date(d.date)
        ) {
          console.log("You are running the latest version! (Date)");
          IS_UPDATING = false;
          notifyAll();
          return;
        }
      }*/
      console.log(
        "This update is released at " + new Date(d.date).toLocaleString()
      );
      console.log("Fetching extra manifest...");
      const res_rend = await got.get(RENDERER_BUILD_FILE_RELEASE, {
        https: {
          rejectUnauthorized: false,
        },
        agent: getProxyAgent(),
        responseType: "json",
      });
      console.log("Downloading files...");
      if (!AJV.validate(BuildInfoSchema, res_rend.body)) {
        console.log("Invalid build info! Skipped updating this time.");
        IS_UPDATING = false;
        notifyAll();
        return;
      }
      if (!(await doUpdate(BASE, res_rend.body as BuildInfo))) {
        console.log("Update failed, let's try again next time.");
        IS_UPDATING = false;
        notifyAll();
        return;
      }
      if (!(await doUpdate(BASE, res.body as BuildInfo))) {
        console.log("Update failed, let's try again next time.");
        IS_UPDATING = false;
        notifyAll();
        return;
      }

      await fs.ensureDir(path.dirname(LOCK_FILE));
      await fs.writeFile(LOCK_FILE, (res.body as BuildInfo).date);
      console.log("Update completed.");
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
/*
async function hintUpdate(d: { version: string; date: string }): Promise<void> {
  const bw = getMainWindow();
  if (bw) {
    await dialog.showMessageBox(bw, {
      title: "我们已为您更新至最新版本",
      message: `这里是 Alicorn Launcher 版本 ${d.version}，创建于 ${d.date}。\n更新已经安装，但当您下一次启动 Alicorn 时它们才会生效。\n感谢您使用 Alicorn 启动器！`,
      buttons: ["不用谢"],
    });
  }
}
*/
export async function doUpdate(
  baseUrl: string,
  info: BuildInfo
): Promise<boolean> {
  try {
    for (const v of info.files) {
      const target = path.resolve(getBasePath(), v);
      console.log("Backing up " + target);
      await backupFile(target);
    }
    for (const v of info.files) {
      console.log("Downloading " + v);
      const target = path.resolve(getBasePath(), v);
      const meta = new DownloadMeta(baseUrl + v, target, "");
      if ((await Serial.getInstance().downloadFile(meta, true)) !== 1) {
        throw "Failed to download: " + meta.url;
      }
    }
    return true;
  } catch (e) {
    console.log(e);
    for (const v of info.files) {
      try {
        const target = path.resolve(getBasePath(), v);
        console.log("Restoring " + target);
        await restoreFile(target);
      } catch {}
    }
    return false;
  }
}

async function backupFile(src: string): Promise<void> {
  try {
    await fs.access(src);
  } catch {
    return;
  }
  await fs.copyFile(src, src + ".backup");
}

async function restoreFile(src: string): Promise<void> {
  try {
    await fs.access(src + ".backup");
  } catch {
    return;
  }
  await fs.copyFile(src + ".backup", src);
}
