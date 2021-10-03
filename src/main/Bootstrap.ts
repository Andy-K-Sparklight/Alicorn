import { app, BrowserWindow, globalShortcut, screen } from "electron";
import { btoa } from "js-base64";
import path from "path";
import { DOH_CONFIGURE } from "../modules/commons/Constants";
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
  mainWindow.once("closed", () => {
    closeWS();
    console.log("Stopping!");
    setTimeout(() => {
      console.log("Too long! Forcefully stopping!");
      process.abort();
    }, 5000);
    app.quit();
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
  applyDoHSettings();
  console.log("Setting up proxy!");
  await initProxy();
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

async function initProxy(): Promise<void> {
  const proc = getString("download.global-proxy");
  if (proc.trim().length === 0) {
    getMainWindow()?.webContents.session.setProxy({
      mode: "system",
    });
    return;
  }
  await getMainWindow()?.webContents.session.setProxy({
    proxyRules: proc,
    proxyBypassRules: getString(
      "download.proxy-bypass",
      "<local>,.cn,.mcbbs.net,.bangbang93.com,.littleservice.cn"
    ),
  });
  console.log("MainWindow Proxy set.");
}

export function applyDoHSettings(): void {
  // @ts-ignore
  if (app.configureHostResolver) {
    // Compatibility
    const dh = getString("doh-server", "Native");
    const p = DOH_CONFIGURE[dh] || "";
    const k = Object.values(DOH_CONFIGURE);
    k.splice(k.indexOf(p), 1);
    if (p.length > 0) {
      console.log("Configuring DoH server as " + p);
      app.configureHostResolver({
        secureDnsMode: "secure",
        secureDnsServers: [p, ...k], // Align the rest
      });
    }
  } else {
    console.log(
      "Current Electron binary doesn't support DoH settings, skipped."
    );
  }
}
