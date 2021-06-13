import { app, BrowserWindow } from "electron";
import os from "os";
import { btoa } from "js-base64";
import { registerBackgroundListeners } from "./Background";
import { checkUpdate } from "./Updator";
import { getBoolean, loadConfig } from "../modules/config/ConfigSupport";
import path from "path";

require("v8-compile-cache");

console.log("Starting Alicorn!");
let mainWindow: BrowserWindow | null = null;
app.on("ready", async () => {
  console.log(
    `With Electron ${process.versions["electron"]}, Node.js ${process.versions["node"]} and Chrome ${process.versions["chrome"]}`
  );
  const appPath = app.getAppPath();
  console.log("App is ready, preparing window...");
  // Open window as soon as possible
  mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      enableRemoteModule: false,
    },
    frame: false,
    show: false,
  });
  mainWindow.setMenu(null);
  console.log("Loading resources...");
  console.log("Registering event listeners...");
  registerBackgroundListeners();
  console.log("Loading config...");
  await loadConfig();
  mainWindow.once("ready-to-show", async () => {
    console.log("Creating window!");
    mainWindow?.show();
    if (getBoolean("updator.use-update")) {
      console.log("Checking updates...");
      await checkUpdate();
    } else {
      console.log("Skipped update checking due to user settings.");
    }
    console.log("All caught up! Alicorn is now initialized.");
  });
  console.log("Preparing window!");
  await mainWindow.loadFile(path.resolve(appPath, "Renderer.html"));
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
  console.log("Finalizing and exiting...");
});

process.on("uncaughtException", async (e) => {
  try {
    console.log(e);
    await mainWindow?.webContents.loadFile("Error.html", {
      hash: btoa(escape(String(e.message))),
    });
  } catch {}
});

process.on("unhandledRejection", async (r) => {
  try {
    console.log(String(r));
    await mainWindow?.webContents.loadFile("Error.html", {
      hash: btoa(escape(String(r))),
    });
  } catch {}
});

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
