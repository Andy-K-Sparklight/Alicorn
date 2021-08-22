import { app, BrowserWindow, globalShortcut, screen } from "electron";
import { btoa } from "js-base64";
import os from "os";
import path from "path";
import { getBoolean, loadConfigSync } from "../modules/config/ConfigSupport";
import { registerBackgroundListeners } from "./Background";
import { getUserBrowser } from "./Browser";
import { closeWS, initWS } from "./WSServer";

console.log("Starting Alicorn!");
let mainWindow: BrowserWindow | null = null;
console.log("Loading config...");
loadConfigSync();
if (!getBoolean("hardware-acc")) {
  app.disableHardwareAcceleration();
}
app.on("ready", async () => {
  console.log(
    `With Electron ${process.versions["electron"]}, Node.js ${process.versions["node"]} and Chrome ${process.versions["chrome"]}`
  );
  const appPath = app.getAppPath();
  console.log("App is ready, preparing window...");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.5),
    height: Math.floor(height * 0.5),
    webPreferences: {
      webSecurity: false, // No more CORS!
      nodeIntegration: true, // Obviously
      nodeIntegrationInWorker: true, // Worker needs mdiff
      contextIsolation: false, // Node
      sandbox: false, // Node
      enableRemoteModule: false, // No sync
    },
    frame: false,
    show: false,
  });
  mainWindow.setMenu(null);
  console.log("Loading resources...");
  console.log("Registering event listeners...");
  registerBackgroundListeners();

  mainWindow.once("ready-to-show", () => {
    console.log("Creating window!");
    mainWindow?.show();
    console.log("All caught up! Alicorn is now initialized.");
    if (getBoolean("dev")) {
      console.log("Development mode detected, opening devtools...");
      mainWindow?.webContents.openDevTools();
    }
  });
  console.log("Preparing window!");
  if (getBoolean("hot-key")) {
    globalShortcut.register("Ctrl+F12", () => {
      if (getBoolean("dev.f12")) {
        mainWindow?.webContents.openDevTools();
      }
    });
    globalShortcut.register("Shift+F12", () => {
      if (getBoolean("dev.f12")) {
        getUserBrowser()?.webContents.openDevTools();
      }
    });
  }
  await mainWindow.loadFile(path.resolve(appPath, "Renderer.html"));
  console.log("Preparing WS!");
  initWS();
  console.log("Setting up proxy!");
});

app.on("window-all-closed", () => {
  if (os.platform() !== "darwin") {
    console.log("Stopping!");
    console.log("Stopping WS!");
    closeWS();
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
      hash: btoa(encodeURI(String(r))),
    });
  } catch {}
});

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
