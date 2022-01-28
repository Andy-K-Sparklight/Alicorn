import CryptoJS from "crypto-js";
import { app, BrowserWindow, ipcMain, ipcRenderer, screen } from "electron";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { getBoolean, getString } from "../modules/config/ConfigSupport";
import { getMainWindow, getMainWindowUATrimmed, initProxy } from "./Bootstrap";

// Active DM file is ~/alicorn/dms/active.ald

const DM_ROOT = path.join(os.homedir(), "alicorn", "dms");
const ACTIVE_DM = "active.ald";
const PACKAGE = "package.json";

let DM_WINDOW: BrowserWindow | null = null;

// Find if there is a DM available, return exactly the html path
export async function getUsingDM(): Promise<string> {
  try {
    const dm = (await fs.readFile(path.join(DM_ROOT, ACTIVE_DM)))
      .toString()
      .trim();
    if (dm.length > 0) {
      const pk = await fs.readJSON(path.join(DM_ROOT, dm, PACKAGE));
      if (pk.main) {
        const f = String(pk.main);
        const t = path.join(DM_ROOT, dm, f);
        await fs.access(t, fs.constants.R_OK);
        return t;
      }
    }
    return "";
  } catch {
    return "";
  }
}

export function closeDM(): void {
  if (DM_WINDOW) {
    DM_WINDOW?.close();
  }
}

export function getDMWindow(): BrowserWindow | null {
  return DM_WINDOW;
}

export function initDisplayManager(mainFile: string): void {
  ipcMain.handle("execX", (_e, js) => {
    return getMainWindow()?.webContents.executeJavaScript(js);
  });
  ipcMain.handle("clickX", (_e, selector, lr) => {
    if (lr === "L") {
      return getMainWindow()?.webContents.executeJavaScript(
        `document.querySelector("${selector}").click();`
      );
    } else {
      return getMainWindow()?.webContents.executeJavaScript(
        `document.querySelector("${selector}").dispatchEvent(new Event("contextmenu"))`
      );
    }
  });
  ipcMain.handle("inputX", (_e, selector, data) => {
    return getMainWindow()?.webContents.executeJavaScript(
      `(()=>{let e=document.querySelector("${selector}");e.value="${data}";let t=new Event("input",{bubbles:true});t.simulated=true;e._valueTracker.setValue(e);e.dispatchEvent(t);})()`
    );
  });
  let cid = 0;
  ipcMain.handle("setValueX", (_e, id, data) => {
    return new Promise<void>((res) => {
      cid++;
      getMainWindow()?.webContents.send("setValueX", id, data, cid);
      ipcMain.once("setValueXOK-" + cid, () => {
        res();
      });
    });
  });
  ipcMain.handle("getValueX", (_e, id) => {
    return new Promise((res) => {
      cid++;
      getMainWindow()?.webContents.send("getValueX", id, cid);
      ipcMain.once("getValueXOK-" + cid, (_e, data) => {
        res(data);
      });
    });
  });
  ipcMain.on("subscribeValueX", (_e, id, eventName) => {
    getMainWindow()?.webContents.send("subscribeValueX", id, eventName);
    const internalEName = `subscribeResultX-${id}-${eventName}`;
    ipcMain.on(internalEName, (_e, data) => {
      _e.sender.send(internalEName, data);
    });
  });
  ipcMain.on("unsubscribeValueX", (_e, id, eventName) => {
    getMainWindow()?.webContents.send("unsubscribeValueX", id, eventName);
    const internalEName = `subscribeResultX-${id}-${eventName}`;
    ipcRenderer.removeAllListeners(internalEName);
  });
  ipcMain.on("openDevToolsDM", () => {
    DM_WINDOW?.webContents.openDevTools();
  });
  const { height } = screen.getPrimaryDisplay().workAreaSize;
  const calH = Math.floor(height * 0.55);
  DM_WINDOW = new BrowserWindow({
    width: Math.floor((calH * 48) / 25),
    height: calH,
    webPreferences: {
      // Same as Alicorn Main
      webSecurity: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      sandbox: false,
      spellcheck: false,
      defaultEncoding: "UTF-8",
      partition:
        "persist:display_manager:" + CryptoJS.SHA1(mainFile).toString(), // Different Session
      backgroundThrottling: false,
      preload: path.resolve(app.getAppPath(), "XClient.js"), // Inject X Client
    },
    frame: getString("frame.drag-impl") === "TitleBar",
    show: false,
    backgroundColor: "#fff",
  });
  getMainWindow()?.webContents.on(
    "console-message",
    (_e, lv, m, lineno, source) => {
      try {
        DM_WINDOW?.webContents.send("consoleMessage", lv, m, lineno, source);
      } catch {}
    }
  );
  DM_WINDOW.once("ready-to-show", async () => {
    console.log("Setting up DM proxy!");
    await initProxy(DM_WINDOW?.webContents.session);
    DM_WINDOW?.on("resize", () => {
      DM_WINDOW?.webContents.send("mainWindowResized", DM_WINDOW.getSize());
    });
    DM_WINDOW?.on("move", () => {
      DM_WINDOW?.webContents.send("mainWindowMoved", DM_WINDOW.getPosition());
    });
    console.log("All caught up! Alicorn Display Manager is now initialized.");
    if (getBoolean("dev")) {
      console.log("Development mode detected, opening devtools...");
      DM_WINDOW?.webContents.openDevTools();
    }
    DM_WINDOW?.show(); // No time for DM to send ready to show
  });
  DM_WINDOW.on("closed", () => {
    getMainWindow()?.show(); // If not closed by itself, main window will show
    // Otherwise this listener should have been removed
  });
  DM_WINDOW.webContents.setUserAgent(getMainWindowUATrimmed());
  void DM_WINDOW.loadFile(mainFile);
}
