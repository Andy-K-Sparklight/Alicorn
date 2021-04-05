import { app, BrowserWindow } from "electron";
import { loadConfig, saveConfigSync } from "./modules/config/ConfigSupport";
import { initConcurrentDownloader } from "./modules/download/Concurrent";
import os from "os";
import path from "path";
import { loadGDT, saveGDTSync } from "./modules/container/ContainerUtil";
import { loadMirror, saveMirrorSync } from "./modules/download/Mirror";
import { initDownloadWrapper } from "./modules/download/DownloadWrapper";
import { btoa } from "js-base64";
import { initEncrypt } from "./modules/security/Encrypt";
import { loadJDT, saveJDTSync } from "./modules/java/JInfo";
import { initForgeInstallModule } from "./modules/pff/install/ForgeInstall";
import { initModInfo } from "./modules/modx/ModInfo";

console.log("Starting Alicorn!");
let mainWindow: BrowserWindow;
let INITIALIZED_BIT = false;
app.on("ready", async () => {
  console.log("App is ready, preparing window...");
  // Open window as soon as possible
  mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    transparent: true,
    webPreferences: {
      preload: path.resolve("Preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
    show: false,
  });
  mainWindow.setMenu(null);
  console.log("Loading resources...");
  await mainWindow.loadFile("Renderer.html");
  mainWindow.once("ready-to-show", async () => {
    console.log("Creating window!");
    mainWindow.show();
    console.log("Running delayed init tasks...");
    await runDelayedInitTask();
    console.log("All caught up! Alicorn is now initialized.");
  });
});

app.on("window-all-closed", () => {
  if (os.platform() !== "darwin") {
    console.log("Stopping!");
    app.quit();
  }
});
// This function doesn't support async!
// Use sync functions.
app.on("will-quit", () => {
  console.log("Saving data...");
  saveConfigSync();
  saveGDTSync();
  saveJDTSync();
  saveMirrorSync();
  console.log("Finalizing and exiting...");
});

async function runDelayedInitTask(): Promise<void> {
  console.log("Loading data and initializing modules...");
  await loadConfig();
  await loadGDT();
  await loadJDT();
  await initEncrypt();
  await loadMirror();
  await initConcurrentDownloader();
  initDownloadWrapper();
  initModInfo();
  await initForgeInstallModule();
  INITIALIZED_BIT = true;
}

process.on("uncaughtException", async (e) => {
  console.log(e);
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
