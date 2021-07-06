import Ajv from "ajv";
import { getBoolean } from "../modules/config/ConfigSupport";
import got from "got";
import BuildInfoSchema from "./BuildInfoSchema.json";
import { getMainWindow } from "./Bootstrap";
import { app, dialog } from "electron";
import {
  DownloadMeta,
  DownloadStatus,
} from "../modules/download/AbstractDownloader";
import { Serial } from "../modules/download/Serial";
import path from "path";
import { getActualDataPath } from "../modules/config/DataSupport";
import fs from "fs-extra";
import { isFileExist } from "../modules/commons/FileUtil";

// MAINTAINERS ONLY

const BASE_URL = "https://services.al.xuogroup.top/";
const RELEASE_FOLDER = BASE_URL + "release/";
const DLL_BUILD_FILE_DEV = BASE_URL + "DllBuild.json";
const MAIN_BUILD_FILE_DEV = BASE_URL + "MainBuild.json";
const RENDERER_BUILD_FILE_DEV = BASE_URL + "RendererBuild.json";
const MAIN_BUILD_FILE_RELEASE = RELEASE_FOLDER + "MainBuild.json";
const RENDERER_BUILD_FILE_RELEASE = RELEASE_FOLDER + "RendererBuild.json";
const LOCK_FILE = getActualDataPath("install.lock");

let updateBit = false;

interface BuildInfo {
  date: string;
  files: string[];
  version: string;
}

const AJV = new Ajv();

export async function checkUpdate(): Promise<void> {
  updateBit = true;
  let HEAD: string;
  let BASE: string;
  if (getBoolean("updator.dev")) {
    HEAD = MAIN_BUILD_FILE_DEV;
    BASE = BASE_URL;
  } else {
    HEAD = MAIN_BUILD_FILE_RELEASE;
    BASE = RELEASE_FOLDER;
  }
  const res = await got.get(HEAD, { cache: false, responseType: "json" });
  let d: BuildInfo;
  if (AJV.validate(BuildInfoSchema, res.body)) {
    d = res.body as BuildInfo;
    if (await isFileExist(LOCK_FILE)) {
      if (
        new Date((await fs.readFile(LOCK_FILE)).toString()) >= new Date(d.date)
      ) {
        console.log("You are running the latest version!");
        updateBit = false;
        return;
      }
    }
    const u = {
      version: d.version,
      date: new Date(d.date).toLocaleDateString(),
    };
    if (getBoolean("updator.dev")) {
      const res_dll = await got.get(DLL_BUILD_FILE_DEV, {
        cache: false,
        responseType: "json",
      });
      if (!AJV.validate(BuildInfoSchema, res_dll.body)) {
        updateBit = false;
        return;
      }
      if (!(await doUpdate(BASE, res_dll.body as BuildInfo))) {
        updateBit = false;
        return;
      }
      const res_rend = await got.get(RENDERER_BUILD_FILE_DEV, {
        cache: false,
        responseType: "json",
      });
      if (!AJV.validate(BuildInfoSchema, res_rend.body)) {
        updateBit = false;
        return;
      }
      if (!(await doUpdate(BASE, res_rend.body as BuildInfo))) {
        updateBit = false;
        return;
      }
      if (!(await doUpdate(BASE, res.body as BuildInfo))) {
        updateBit = false;
        return;
      }
      await hintUpdate(u);
    } else {
      const res_rend = await got.get(RENDERER_BUILD_FILE_RELEASE, {
        cache: false,
        responseType: "json",
      });
      if (!AJV.validate(BuildInfoSchema, res_rend.body)) {
        updateBit = false;
        return;
      }
      if (!(await doUpdate(BASE, res_rend.body as BuildInfo))) {
        updateBit = false;
        return;
      }
      if (!(await doUpdate(BASE, res.body as BuildInfo))) {
        updateBit = false;
        return;
      }
      await hintUpdate(u);
      updateBit = false;
    }
  } else {
    console.log("Invalid build info! Skipped updating this time.");
    updateBit = false;
  }
}

export async function hintUpdate(d: {
  version: string;
  date: string;
}): Promise<void> {
  const bw = getMainWindow();
  if (bw) {
    await dialog.showMessageBox(bw, {
      title: "我们已为您更新至最新版本",
      message: `这里是 Alicorn Launcher 版本 ${d.version}，创建于 ${d.date}。\n更新已经安装，但当您下一次启动 Alicorn 时它们才会生效。\n感谢您使用 Alicorn 启动器！`,
      buttons: ["不用谢"],
    });
  }
}

export async function doUpdate(
  baseUrl: string,
  info: BuildInfo
): Promise<boolean> {
  await fs.ensureDir(path.dirname(LOCK_FILE));
  await fs.writeFile(LOCK_FILE, info.date);
  try {
    for (const v of info.files) {
      const meta = new DownloadMeta(
        baseUrl + v,
        path.resolve(app.getAppPath(), v),
        ""
      );
      if (
        (await Serial.getInstance().downloadFile(meta)) in
        [DownloadStatus.RETRY, DownloadStatus.FATAL]
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
