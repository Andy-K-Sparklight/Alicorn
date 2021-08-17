import Ajv from "ajv";
import fs from "fs-extra";
import got from "got";
import os from "os";
import path from "path";
import { isFileExist } from "../commons/FileUtil";
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
export function initUpdator(): void {
  BASE_URL = getString(
    "updator.url",
    "https://cdn.jsdelive.net/gh/Andy-K-Sparklight/Alicorn@production/"
  );
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

const AJV = new Ajv();

export async function checkUpdate(): Promise<void> {
  if (os.platform() === "darwin") {
    // macOS updates isn't supported yet
    console.log("Skipped update checking due to unsupported platform.");
    return;
  }
  const HEAD = MAIN_BUILD_FILE_RELEASE;
  const BASE = RELEASE_FOLDER;
  const res = await got.get(HEAD, {
    https: {
      rejectUnauthorized: false,
    },
    responseType: "json",
    agent: getProxyAgent(),
  });
  console.log("Validating build info!");
  let d: BuildInfo;
  if (AJV.validate(BuildInfoSchema, res.body)) {
    d = res.body as BuildInfo;
    if (await isFileExist(LOCK_FILE)) {
      if (
        new Date((await fs.readFile(LOCK_FILE)).toString()) >= new Date(d.date)
      ) {
        console.log("You are running the latest version!");
        return;
      }
    }

    const res_rend = await got.get(RENDERER_BUILD_FILE_RELEASE, {
      https: {
        rejectUnauthorized: false,
      },
      agent: getProxyAgent(),
      responseType: "json",
    });
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

    await fs.ensureDir(path.dirname(LOCK_FILE));
    await fs.writeFile(LOCK_FILE, (res.body as BuildInfo).date);
    // await hintUpdate(u); We have a page to show update
  } else {
    console.log("Invalid build info! Skipped updating this time.");
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
      await backupFile(target);
    }
    for (const v of info.files) {
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
        await restoreFile(target);
      } catch {}
    }
    return false;
  }
}

async function backupFile(src: string): Promise<void> {
  await fs.copyFile(src, src + ".backup");
}

async function restoreFile(src: string): Promise<void> {
  await fs.copyFile(src + ".backup", src);
}
