import { app, BrowserWindow, globalShortcut, screen } from "electron";
import { btoa } from "js-base64";
import path from "path";
import {
  getBoolean,
  getString,
  loadConfigSync,
} from "../modules/config/ConfigSupport";
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
  const { height } = screen.getPrimaryDisplay().workAreaSize;
  const calH = Math.floor(height * 0.5);
  mainWindow = new BrowserWindow({
    width: Math.floor((calH * 48) / 25),
    height: calH,
    webPreferences: {
      webSecurity: false, // No more CORS!
      nodeIntegration: true, // Obviously
      nodeIntegrationInWorker: true, // Worker needs mdiff
      contextIsolation: false, // Node
      sandbox: false, // Node
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
  initProxy();
});

app.on("window-all-closed", () => {
  console.log("Stopping!");
  closeWS();
  app.quit();
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

function initProxy(): void {
  const proc = getString(
    "download.global-proxy",
    "<local>,.cn,.mcbbs.net,.bangbang93.com,.littleservice.cn",
    true
  );
  if (proc.trim().length === 0) {
    getMainWindow()?.webContents.session.setProxy({
      proxyRules: "direct://",
    });
    return;
  }
  getMainWindow()?.webContents.session.setProxy({
    proxyRules: proc,
    proxyBypassRules: getString("download.proxy-bypass"),
  });
  console.log("MainWindow Proxy set.");
}
