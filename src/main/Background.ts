import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  screen,
} from "electron";
import isReachable from "is-reachable";
import os from "os";
import {
  getBoolean,
  getNumber,
  loadConfig,
} from "../modules/config/ConfigSupport";
import { getMainWindow } from "./Bootstrap";
import { getUserBrowser, openBrowser } from "./Browser";

const LOGIN_START =
  "https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf";
let loginWindow: BrowserWindow | null = null;
let logoutWindow: BrowserWindow | null = null;
const CODE_REGEX = /(?<=\?code=)[^&]+/gi;
const ERROR_REGEX = /(?<=\?error=)[^&]+/gi;
const ERROR_DESCRIPTION = /(?<=&error_description=)[^&]+/gi;
const SIGN_OUT_SELECTOR = "mectrl_body_signOut";
const BASE_ACCOUNT_URL = "https://account.microsoft.com/";
const LOGOUT_FINAL = "https://account.microsoft.com/account/Account";

export function registerBackgroundListeners(): void {
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
      logoutWindow?.destroy();
    } catch {}
    try {
      getUserBrowser()?.destroy();
    } catch {}

    console.log("All windows are closed.");
    console.log("Waiting for application exit...");
    setTimeout(() => {
      console.log("Too long! Forcefully stopping!");
      app.quit();
    }, 5000);
  });
  ipcMain.on("getAppPath", (e) => {
    e.returnValue = app.getAppPath();
  });
  ipcMain.on("openDevTools", () => {
    getMainWindow()?.webContents.openDevTools();
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
  ipcMain.handle("msBrowserCode", async (_e, proxy: string) => {
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
        });
      if (proxy.trim().length > 0) {
        await loginWindow.webContents.session.setProxy({
          proxyRules: `${proxy},direct://`,
        });
      }
      await loginWindow.loadURL(LOGIN_START);
      return new Promise<string>((resolve) => {
        loginWindow?.on("close", () => {
          if (sCode === "") {
            console.log("Unexpected window closing, what have you done?");
            resolve("");
          }
        });
        loginWindow?.webContents.on("did-stop-loading", () => {
          const url = loginWindow?.webContents.getURL();
          if (url?.startsWith("https://login.live.com/oauth20_desktop.srf")) {
            if (CODE_REGEX.test(url)) {
              console.log("Code found. Closing login window.");
              sCode = unescape((url.match(CODE_REGEX) || [])[0] || "");
              loginWindow?.close();
              loginWindow = null;
              resolve(sCode);
              return;
            }
            if (ERROR_REGEX.test(url)) {
              sCode = "NOT FOUND";
              console.log(
                "Error during login: " +
                  unescape((url.match(ERROR_REGEX) || [])[0] || "")
              );
              console.log(
                "Caused by: " +
                  unescape((url.match(ERROR_DESCRIPTION) || [])[0] || "")
              );
            }
            console.log("Error occurred. Closing login window.");
            loginWindow?.close();
            loginWindow = null;
            resolve("");
          } else {
            console.log("Not a callback URL, showing window...");
            loginWindow?.show();
          }
        });
      });
    } catch {}
  });
  ipcMain.handle("msLogout", async (_e, proxy: string) => {
    console.log("Creating logout window!");
    logoutWindow = new BrowserWindow({
      frame: false,
      width: 960,
      height: 540,
      show: false,
    });
    if (proxy.trim().length > 0) {
      await logoutWindow.webContents.session.setProxy({
        proxyRules: `${proxy},direct://`,
      });
    }
    await logoutWindow.loadURL(BASE_ACCOUNT_URL);
    return new Promise<void>((resolve) => {
      logoutWindow?.webContents.on("dom-ready", () => {
        const r = logoutWindow?.webContents.executeJavaScript(
          `var e=document.getElementById("${SIGN_OUT_SELECTOR}");if(e!==null&&typeof e==="object"&&typeof e["click"]==="function"){e.click()}`
        );
        if (r !== undefined) {
          r.then(() => {
            console.log(
              "Command sent, but this window will not be closed until totally finished."
            );
            resolve();
          }).catch(() => {
            // This should not happen!
            resolve();
          });
        }
      });
      logoutWindow?.webContents.on("did-stop-loading", () => {
        if (logoutWindow?.webContents.getURL().startsWith(LOGOUT_FINAL)) {
          console.log("Logout finished, closing window!");
          resolve();
          logoutWindow?.close();
          logoutWindow = null;
        }
      });
    });
  });
  ipcMain.handle("openBrowser", async (_e, node: boolean, proxy: string) => {
    await openBrowser(node, proxy);
  });
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
}
