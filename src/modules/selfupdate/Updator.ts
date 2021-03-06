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
        return;
      }
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
        return;
      }
      if (!(await doUpdate(BASE, res_rend.body as BuildInfo))) {
        console.log("Update failed, let's try again next time.");
        return;
      }
      if (!(await doUpdate(BASE, res.body as BuildInfo))) {
        console.log("Update failed, let's try again next time.");
        return;
      }
      console.log("Switching files...");
      IS_UPDATING = true;
      try {
        await switchFile(res.body as BuildInfo);
        await switchFile(res_rend.body as BuildInfo);
      } catch (e) {
        console.log(e);
        console.log("File switch failed! Error is present above.");
        IS_UPDATING = false;
        notifyAll();
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
      title: "????????????????????????????????????",
      message: `????????? Alicorn Launcher ?????? ${d.version}???????????? ${d.date}???\n????????????????????????????????????????????? Alicorn ????????????????????????\n??????????????? Alicorn ????????????`,
      buttons: ["?????????"],
    });
  }
}
*/
export async function doUpdate(
  baseUrl: string,
  info: BuildInfo
): Promise<boolean> {
  try {
    const basePath = getBasePath();
    for (const v of info.files) {
      console.log("Downloading " + v);
      const target = path.resolve(basePath, v + ".local");
      // First download all, then rename
      const meta = new DownloadMeta(baseUrl + v, target, "");
      if ((await Serial.getInstance().downloadFile(meta, true)) !== 1) {
        throw "Failed to download: " + meta.url;
      }
    }
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function switchFile(bInfo: BuildInfo): Promise<boolean> {
  try {
    const basePath = getBasePath();
    await Promise.all(
      bInfo.files.map((v) => {
        const origin = path.resolve(basePath, v + ".local");
        const target = path.resolve(basePath, v);
        return fs.rename(origin, target); // Pass Promise
      })
    );
    return true;
  } catch (e) {
    return false;
  }
}
