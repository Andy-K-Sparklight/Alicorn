import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Session,
} from "electron";
import { btoa } from "js-base64";
import path from "path";
import { DOH_CONFIGURE } from "../modules/commons/Constants";
import {
  getBoolean,
  getNumber,
  getString,
  loadConfigSync,
} from "../modules/config/ConfigSupport";
import { setBeacon } from "../modules/selfupdate/Beacon";
import { registerBackgroundListeners } from "./Background";
import { getUsingDM, initDisplayManager } from "./DisplayManager";

console.log("Starting Alicorn!");

let mainWindow: BrowserWindow | null = null;

const COOKIES_BLACKLIST = /(mcbbs\.net|\.cn)/i;

let READY_LOCK = false;
if (!app.requestSingleInstanceLock()) {
  console.log("Another Alicorn is running! I'm leaving now...");
  app.exit();
} else {
  READY_LOCK = true;
  app.on("second-instance", () => {
    getMainWindow()?.restore();
    getMainWindow()?.webContents.send("CallFromSleep");
  });
}
process.on("beforeExit", () => {
  if (READY_LOCK) {
    app.releaseSingleInstanceLock();
  }
});
if (READY_LOCK) {
  main();
}

process.on("SIGINT", () => {
  if (READY_LOCK) {
    app.releaseSingleInstanceLock();
  }
  process.exit();
});

process.on("SIGTERM", () => {
  if (READY_LOCK) {
    app.releaseSingleInstanceLock();
  }
  process.exit();
});

process.on("exit", () => {
  if (READY_LOCK) {
    app.releaseSingleInstanceLock();
  }
});

async function whenAppReady() {
  if (!app.isReady()) {
    return;
  }
  console.log(
    `With Electron ${process.versions["electron"]}, Node.js ${process.versions["node"]} and Chrome ${process.versions["chrome"]}`
  );
  const appPath = app.getAppPath();
  console.log("App is ready, preparing window...");
  const { height } = screen.getPrimaryDisplay().workAreaSize;
  const calH = Math.floor(height * 0.55);
  mainWindow = new BrowserWindow({
    width: Math.floor((calH * 48) / 25),
    height: calH,
    webPreferences: {
      webSecurity: false, // No more CORS!
      nodeIntegration: true, // Obviously
      nodeIntegrationInWorker: true, // Worker needs mdiff
      contextIsolation: false, // Node
      sandbox: false, // Node
      spellcheck: false,
      zoomFactor: getNumber("theme.zoom-factor", 1.0),
      defaultEncoding: "UTF-8",
      backgroundThrottling: false,
    },
    frame: getString("frame.drag-impl") === "TitleBar",
    show: false,
    backgroundColor: "#fff",
  });
  mainWindow.setAspectRatio(1.92);
  mainWindow.setMenu(null);
  mainWindow.webContents.on("did-navigate-in-page", () => {
    mainWindow?.webContents.setZoomLevel(0);
  });
  mainWindow.webContents.on("paint", () => {
    mainWindow?.webContents.setZoomLevel(0);
  });
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.setZoomLevel(0);
  });
  console.log("Loading resources...");
  console.log("Registering event listeners...");
  registerBackgroundListeners();
  let readyToClose = false;
  ipcMain.once("allowShowWindow", async () => {
    const dm = await getUsingDM();
    if (dm) {
      console.log("Display Manager found, enabling...");
      initDisplayManager(dm);
    } else {
      console.log("Opening window!");
      mainWindow?.show();
    }
  });
  ipcMain.on("readyToClose", () => {
    readyToClose = true;
  });
  mainWindow.on("close", (e) => {
    if (!readyToClose) {
      e.preventDefault();
      mainWindow?.webContents.send("YouAreGoingToBeKilled");
    }
  });
  mainWindow.once("ready-to-show", async () => {
    applyDoHSettings();
    console.log("Setting up proxy!");
    await initProxy(getMainWindow()?.webContents.session);
    mainWindow?.on("resize", () => {
      mainWindow?.webContents.send("mainWindowResized", mainWindow.getSize());
    });
    mainWindow?.on("move", () => {
      mainWindow?.webContents.send("mainWindowMoved", mainWindow.getPosition());
    });
    console.log("Placing beacon!");
    try {
      await setBeacon();
    } catch (e) {
      console.log(e);
    }
    console.log("All caught up! Alicorn is now initialized.");
    if (getBoolean("dev")) {
      console.log("Development mode detected, opening devtools...");
      mainWindow?.webContents.openDevTools();
    }
  });
  mainWindow.once("closed", () => {
    console.log("Stopping!");
    setTimeout(() => {
      console.log("Too long! Forcefully stopping!");
      process.abort();
    }, 5000);
    app.quit();
  });
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      if (COOKIES_BLACKLIST.test(details.url)) {
        if (details.responseHeaders) {
          if (details.responseHeaders["Set-Cookie"]) {
            delete details.responseHeaders["Set-Cookie"];
          }
          if (details.responseHeaders["set-cookie"]) {
            delete details.responseHeaders["set-cookie"];
          }
        }
      }
      callback({ responseHeaders: details.responseHeaders });
    }
  );
  console.log("Preparing window!");
  if (getBoolean("hot-key")) {
    globalShortcut.register("Ctrl+F12", () => {
      if (getBoolean("dev.f12")) {
        mainWindow?.webContents.openDevTools();
      }
    });
  }
  await mainWindow.loadFile(path.resolve(appPath, "Renderer.html"));
  mainWindow?.webContents.setZoomLevel(0);
}

function main() {
  console.log("Loading config...");
  loadConfigSync();
  if (!getBoolean("hardware-acc") && !getBoolean("features.skin-view-3d")) {
    // If 3D enabled then we should use hardware acc
    try {
      app.disableHardwareAcceleration();
    } catch {}
  }
  const CONNECTION_UNLIMITED_DOMAINS = [
    "mcbbs.net",
    "download.mcbbs.net",
    "bangbang93.com",
    "bmclapi2.bangbang93.com",
    "forgecdn.net",
    "media.forgecdn.net",
    "modrinth.com",
    "cdn.modrinth.com",
    "minecraft.net",
    "libraries.minecraft.net",
    "mojang.com",
    "launcher.mojang.com",
    "launchermeta.mojang.com",
    "minecraftforge.net",
    "maven.minecraftforge.net",
    "files.minecraftforge.net",
    "resources.download.minecraft.net",
    "maven.fabricmc.net",
    "meta.fabricmc.net",
    "fabricmc.net",
  ];
  app.commandLine.appendSwitch("ignore-certificate-errors");
  app.commandLine.appendSwitch(
    "ignore-connections-limit",
    CONNECTION_UNLIMITED_DOMAINS.join(",")
  );
  app.commandLine.appendSwitch("js-flags", "--expose_gc"); // Enable gc
  // app.commandLine.appendSwitch("--force_high_performance_gpu"); // Enable High Performance GPU
  app.on("before-quit", () => {
    if (READY_LOCK) {
      app.releaseSingleInstanceLock();
    }
  });
  app.on("ready", async () => {
    if (READY_LOCK) {
      await whenAppReady();
    }
  });

  // This function doesn't support async!
  // Use sync functions.
  app.on("will-quit", () => {
    if (READY_LOCK) {
      app.releaseSingleInstanceLock();
    }
    console.log("Finalizing and exiting...");
  });

  process.on("uncaughtException", async (e) => {
    try {
      console.log(e);
      await mainWindow?.webContents.loadFile("Error.html", {
        hash: btoa(encodeURIComponent(String(e.message))),
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
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export async function initProxy(session?: Session): Promise<void> {
  const proc = getString("download.global-proxy");
  if (proc.trim().length === 0) {
    /* await getMainWindow()?.webContents.session.setProxy({
      mode: "auto_detect",
    }); */
    // Let Electron decide!
    return;
  }
  await session?.setProxy({
    proxyRules: proc,
    proxyBypassRules: getString(
      "download.proxy-bypass",
      "<local>,.cn,.mcbbs.net,.bangbang93.com,.littleservice.cn"
    ),
  });
  console.log("Proxy set.");
}

function applyDoHSettings(): void {
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

export function getMainWindowUATrimmed(): string {
  const ua = mainWindow?.webContents.getUserAgent();
  if (ua) {
    const uas = ua.split(" ");
    const o: string[] = [];
    uas.forEach((unit) => {
      if (!unit.includes("Alicorn") && !unit.includes("Electron")) {
        o.push(unit);
      }
    });
    return o.join(" ");
  }
  return "";
}
