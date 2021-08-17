import Ajv from "ajv";
import { app } from "electron";
import fs from "fs-extra";
import got from "got";
import os from "os";
import path from "path";
import { isFileExist } from "../modules/commons/FileUtil";
import { getActualDataPath } from "../modules/config/DataSupport";
import { DownloadMeta } from "../modules/download/AbstractDownloader";
import { getProxyAgent } from "../modules/download/ProxyConfigure";
import { Serial } from "../modules/download/Serial";
import BuildInfoSchema from "./BuildInfoSchema.json";

// MAINTAINERS ONLY

const BASE_URL = "https://services.al.xuogroup.top/";
const RELEASE_FOLDER = BASE_URL + "release/";
const MAIN_BUILD_FILE_RELEASE = RELEASE_FOLDER + "MainBuild.json";
const RENDERER_BUILD_FILE_RELEASE = RELEASE_FOLDER + "RendererBuild.json";
const LOCK_FILE = getActualDataPath("install.lock");

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
    const u = {
      version: d.version,
      date: new Date(d.date).toLocaleDateString(),
    };

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
  await fs.ensureDir(path.dirname(LOCK_FILE));
  await fs.writeFile(LOCK_FILE, info.date);
  try {
    for (const v of info.files) {
      const target = path.resolve(app.getAppPath(), v);
      await backupFile(target);
    }
    for (const v of info.files) {
      const target = path.resolve(app.getAppPath(), v);
      const meta = new DownloadMeta(baseUrl + v, target, "");

      if ((await Serial.getInstance().downloadFile(meta)) !== 1) {
        throw "Failed to download!";
      }
    }
    return true;
  } catch {
    for (const v of info.files) {
      try {
        const target = path.resolve(app.getAppPath(), v);
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
