import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  safeStorage,
  screen,
  shell,
} from "electron";
import isReachable from "is-reachable";
import os from "os";
import path from "path";
import {
  getBoolean,
  getNumber,
  loadConfig,
} from "../modules/config/ConfigSupport";
import { getMainWindow, getMainWindowUATrimmed } from "./Bootstrap";
const LOGIN_START =
  "https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf";
let loginWindow: BrowserWindow | null = null;
const CODE_REGEX = /(?<=\?code=)[^&]+/gi;
const ERROR_REGEX = /(?<=\?error=)[^&]+/gi;
const ERROR_DESCRIPTION = /(?<=&error_description=)[^&]+/gi;

export function registerBackgroundListeners(): void {
  ipcMain.on("reload", () => {
    app.relaunch();
    app.exit(); // Immediately
  });
  ipcMain.handle("markLoginItem", (_e, i: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: i,
    });
  });
  ipcMain.on("closeWindow", () => {
    console.log("Closing window!");
    // My poor hooves!!!
    // Use destroy to make sure they close
    try {
      getMainWindow()?.close();
    } catch {}
    try {
      loginWindow?.destroy();
    } catch {}
    try {
      getMainWindow()?.destroy();
    } catch {}

    console.log("All windows are closed.");
    console.log("Waiting for application exit...");
    setTimeout(() => {
      console.log("Too long! Forcefully stopping!");
      process.abort();
    }, 5000);
    app.releaseSingleInstanceLock();
    app.exit();
  });
  ipcMain.on("SOS", (_i, e) => {
    dialog.showErrorBox(
      "Alicorn has crashed!",
      "An error has occurred, consider REPORT or REINSTALL.\nError message is:\n\n" +
        String(e)
    );
  });
  ipcMain.on("getAppPath", (e) => {
    e.returnValue = app.getAppPath();
  });
  ipcMain.on("getMainExecutable", (e) => {
    e.returnValue = app.getPath("exe");
  });
  ipcMain.on("openDevTools", () => {
    getMainWindow()?.webContents.openDevTools();
  });
  ipcMain.on("askInject", (e) => {
    if (process.env.ALICORN_REACT_DEVTOOLS) {
      const mw = getMainWindow();
      if (mw) {
        const allow = dialog.showMessageBoxSync(mw, {
          type: "warning",
          buttons: ["No, reject it", "It's fine, just continue"],
          message:
            "ALICORN_REACT_DEVTOOLS has been set and external scripts will be injected, which should only happen during the development.\nIf you are NOT DEVELOPNING Alicorn, this might be an XSS attack.\n\nContinue and accept external scripts to inject?",
        });
        e.returnValue = allow === 1;
      }
    }
  });
  ipcMain.handle("selectDir", async () => {
    const r = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory", "promptToCreate"],
    });
    if (r.canceled) {
      return "";
    }
    return r.filePaths[0] || "";
  });
  ipcMain.handle("selectFile", async () => {
    const r = await dialog.showOpenDialog({
      properties: ["openFile"],
    });
    if (r.canceled) {
      return "";
    }
    return r.filePaths[0] || "";
  });
  ipcMain.handle("selectPng", async () => {
    const r = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Minecraft Skin or Cape",
          extensions: ["png"],
        },
      ],
    });
    if (r.canceled) {
      return "";
    }
    return r.filePaths[0] || "";
  });
  ipcMain.handle("selectModpack", async () => {
    const r = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Modpack Archive",
          extensions: ["zip"],
        },
        {
          name: "Install.json Generic Profile",
          extensions: ["json"],
        },
      ],
    });
    if (r.canceled) {
      return "";
    }
    return r.filePaths[0] || "";
  });
  ipcMain.handle("selectJava", async () => {
    const r = await dialog.showOpenDialog({
      properties: ["openFile", "dontAddToRecent"],
      filters:
        os.platform() === "win32"
          ? [
              {
                name: "Java Executable",
                extensions: ["exe"],
              },
            ]
          : [],
    });
    if (r.canceled) {
      return "";
    }
    return r.filePaths[0] || "";
  });
  ipcMain.handle(
    "msBrowserCode",
    async (
      _e,
      proxy: string,
      quiet = false,
      key = "alicorn_ms_login_initial",
      texts: string[] = []
    ) => {
      let t: number | null = null;
      try {
        let sCode = "";
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        loginWindow =
          loginWindow ||
          new BrowserWindow({
            frame: false,
            width: Math.floor(width * 0.6),
            height: Math.floor(height * 0.6),
            show: false,
            backgroundColor: "#fff",
            webPreferences: {
              partition: "persist:" + key,
              spellcheck: false,
            },
          });
        loginWindow.webContents.setUserAgent(getMainWindowUATrimmed());
        if (proxy.trim().length > 0) {
          await loginWindow.webContents.session.setProxy({
            proxyRules: proxy,
          });
        } /* else {
          await loginWindow.webContents.session.setProxy({
            mode: "system",
          });
        } */
        await loginWindow.loadURL(LOGIN_START);
        return new Promise<string>((resolve) => {
          loginWindow?.on("close", () => {
            if (sCode === "") {
              console.log("Unexpected window closing, what have you done?");
              if (t) {
                clearTimeout(t);
              }
              resolve("");
            }
          });
          loginWindow?.webContents.on("did-stop-loading", () => {
            const url = loginWindow?.webContents.getURL();
            if (url?.startsWith("https://login.live.com/oauth20_desktop.srf")) {
              if (CODE_REGEX.test(url)) {
                console.log("Code found. Closing login window.");
                sCode = decodeURIComponent(
                  (url.match(CODE_REGEX) || [])[0] || ""
                );
                loginWindow?.close();
                loginWindow = null;
                if (t) {
                  clearTimeout(t);
                }
                resolve(sCode);
                return;
              }
              if (ERROR_REGEX.test(url)) {
                sCode = "NOT FOUND";
                console.log(
                  "Error during login: " +
                    decodeURIComponent((url.match(ERROR_REGEX) || [])[0] || "")
                );
                console.log(
                  "Caused by: " +
                    decodeURIComponent(
                      (url.match(ERROR_DESCRIPTION) || [])[0] || ""
                    )
                );
              }
              console.log("Error occurred. Closing login window.");
              loginWindow?.close();
              loginWindow = null;
              if (t) {
                clearTimeout(t);
              }
              resolve("");
            } else {
              if (quiet) {
                console.log(
                  "Not a callback URL, but quiet required, resolving."
                );
                resolve("");
                loginWindow?.close();
                loginWindow = null;
                return;
              }
              console.log("Not a callback URL, showing window...");
              if (!loginWindow?.isVisible()) {
                loginWindow?.show();
                t = setTimeout(async () => {
                  const res = await dialog.showMessageBox({
                    title: texts[0],
                    message: texts[1],
                    buttons: [texts[2], texts[3]],
                    type: "question",
                  });
                  if (res.response === 1) {
                    sCode = "USER PROVIDE";
                    try {
                      loginWindow?.close();
                      loginWindow?.destroy();
                    } catch {}
                    loginWindow = null;
                    await shell.openExternal(LOGIN_START);
                    resolve(sCode);
                  }
                }, 30000) as unknown as number;
              }
            }
          });
        });
      } catch {}
    }
  );
  ipcMain.handle("getMainWindow", () => {
    return getMainWindow()?.webContents.id || 0;
  });
  ipcMain.on("reloadConfig", async () => {
    await loadConfig();
    console.log("Config reloaded.");
  });
  ipcMain.on("reportError", (_e, msg) => {
    if (getBoolean("dev.explicit-error-throw")) {
      dialog.showErrorBox("Oops!", msg);
    }
  });
  ipcMain.on("registerHotKey", (_e, keyBound: string, signal = keyBound) => {
    if (getBoolean("hot-key")) {
      globalShortcut.register(keyBound, () => {
        getMainWindow()?.webContents.send(signal);
      });
    }
  });
  ipcMain.handle(
    "isReachable",
    async (_e, address: string, timeout?: number) => {
      return await isReachable(address, {
        timeout: timeout
          ? timeout
          : getNumber("starlight.join-server.timeout", 2000),
      });
    }
  );
  ipcMain.on("hideWindow", () => {
    getMainWindow()?.hide();
  });
  ipcMain.on("showWindow", () => {
    getMainWindow()?.show();
  });
  ipcMain.on("changeDir", (_e, d: string) => {
    process.chdir(d);
  });
  ipcMain.handle("getElectronVersion", () => {
    return Promise.resolve(process.versions["electron"]);
  });
  ipcMain.on("configureWindowSize", (_e, w: number, h: number) => {
    const mw = getMainWindow();
    if (isNaN(w) || isNaN(h)) {
      return;
    }
    mw?.setSize(w, h);
  });
  ipcMain.on("configureWindowPos", (_e, w: number, h: number) => {
    const mw = getMainWindow();
    if (isNaN(w) || isNaN(h)) {
      return;
    }
    mw?.setPosition(w, h);
  });
  ipcMain.on("windowMoving", (_e, { mouseX, mouseY }) => {
    const { x, y } = screen.getCursorScreenPoint();
    getMainWindow()?.setPosition(x - mouseX, y - mouseY);
  });

  ipcMain.on("ReloadWindow", () => {
    void getMainWindow()?.loadFile(
      path.resolve(app.getAppPath(), "Renderer.html")
    );
  });
  ipcMain.on("encryptSync", (e, s: string) => {
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        e.returnValue = safeStorage.encryptString(s).toString("base64");
      } else {
        e.returnValue = "";
      }
    } catch {
      e.returnValue = "";
    }
  });
  ipcMain.on("decryptSync", (e, b: string) => {
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        e.returnValue = safeStorage.decryptString(Buffer.from(b, "base64"));
      } else {
        e.returnValue = "";
      }
    } catch {
      e.returnValue = "";
    }
  });
}
