import { app, BrowserWindow } from "electron";
import { loadConfig, saveConfig } from "./config/ConfigSupport";
import { initConcurrentDownloader } from "./download/Concurrent";
import os from "os";
import path from "path";
import { loadGDT, saveGDT } from "./container/Container";
import { loadMirror, saveMirror } from "./download/Mirror";
import { initDownloadWrapper } from "./download/DownloadWrapper";
import { isDev } from "./dev/DevSupport";
import { btoa } from "js-base64";
import { initEncrypt } from "./security/Encrypt";
import { launchProfile, LaunchSeqSignal } from "./launch/LaunchPad";
import { MinecraftContainer } from "./container/MinecraftContainer";
import { LocalAccount } from "./auth/LocalAccount";
import EventEmitter from "events";
import { PROCESS_END_GATE, PROCESS_LOG_GATE } from "./commons/Constants";
import { Pair } from "./commons/Collections";

let mainWindow: BrowserWindow;
let INITIALIZED_BIT = false;
app.on("ready", async () => {
  // Open window as soon as possible
  mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    webPreferences: {
      preload: path.resolve("Preload.js"),
    },
  });
  mainWindow.setMenu(null);
  await mainWindow.loadFile("Renderer.html");
  if (await isDev()) {
    mainWindow.webContents.openDevTools();
  }
  await runDelayedInitTask();
  const acc = new LocalAccount("ThatRarityEG");
  const emt = new EventEmitter();

  emt.on(LaunchSeqSignal.PROFILE_LOADING, () => {
    console.log(LaunchSeqSignal.PROFILE_LOADING);
  });
  emt.on(LaunchSeqSignal.LIBRARIES_FILLING, () => {
    console.log(LaunchSeqSignal.LIBRARIES_FILLING);
  });
  emt.on(LaunchSeqSignal.ASSETS_FILLING, () => {
    console.log(LaunchSeqSignal.ASSETS_FILLING);
  });
  emt.on(LaunchSeqSignal.ARGS_GENERATING, () => {
    console.log(LaunchSeqSignal.ARGS_GENERATING);
  });
  emt.on(LaunchSeqSignal.DONE, () => {
    console.log(LaunchSeqSignal.DONE);
  });
  emt.on(PROCESS_LOG_GATE, (d) => {
    console.log(d);
  });
  emt.on(PROCESS_END_GATE, (e) => {
    console.log("Exit: " + e);
  });
  await launchProfile(
    "1.16.5",
    new MinecraftContainer("F:/.minecraft", "P:"),
    "C:\\Program Files\\AdoptOpenJDK\\jdk-11.0.10.9-openj9\\bin\\javaw.exe",
    await acc.buildAccessData(),
    new Pair<EventEmitter, EventEmitter>(emt, emt),
    {
      useAj: false,
      useServer: false,
      resolution: new Pair<number, number>(800, 450),
    }
  );
});

app.on("window-all-closed", async () => {
  if (os.platform() !== "darwin") {
    app.quit();
  }
});
app.on("will-quit", async () => {
  await saveConfig();
  await saveGDT();
  await saveMirror();
});

async function runDelayedInitTask(): Promise<void> {
  await loadGDT();
  await initEncrypt();
  await loadMirror();
  await initConcurrentDownloader();
  initDownloadWrapper();
  await loadConfig();
  INITIALIZED_BIT = true;
}

process.on("uncaughtException", async (e) => {
  await mainWindow.webContents.loadFile("Error.html", {
    hash: btoa(escape(String(e.message))),
  });
});

process.on("unhandledRejection", async (r) => {
  console.log(String(r));
  await mainWindow.webContents.loadFile("Error.html", {
    hash: btoa(escape(String(r))),
  });
});
