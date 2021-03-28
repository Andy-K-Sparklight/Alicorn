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

let mainWindow: BrowserWindow;
let INITIALIZED_BIT = false;
app.on("ready", async () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    webPreferences: {
      preload: path.resolve("Preload.js"),
    },
  });
  mainWindow.setMenu(null);
  await mainWindow.loadFile("Renderer.html");
  await runDelayedInitTask();
  if (await isDev()) {
    mainWindow.webContents.openDevTools();
  }
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
