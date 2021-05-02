import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { getMainWindow } from "./Bootstrap";

const LOGIN_START =
  "https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf";
let window: BrowserWindow | null = null;
const CODE_REGEX = /(?<=\?code=)[^&]+/gi;
const ERROR_REGEX = /(?<=\?error=)[^&]+/gi;
const ERROR_DESCRIPTION = /(?<=&error_description=)[^&]+/gi;

export function registerBackgroundListeners(): void {
  ipcMain.on("closeWindow", () => {
    console.log("Closing window!");
    getMainWindow()?.close();
  });
  ipcMain.on("getAppPath", (e) => {
    e.returnValue = app.getAppPath();
  });
  ipcMain.on("openDevTools", () => {
    getMainWindow()?.webContents.openDevTools();
  });
  ipcMain.handle("selectDir", async () => {
    const r = await dialog.showOpenDialog({
      properties: [
        "openDirectory",
        "createDirectory",
        "promptToCreate",
        "dontAddToRecent",
      ],
    });
    if (r.canceled) {
      return "";
    }
    return r.filePaths[0] || "";
  });
  // Auth helper in background
  ipcMain.handle("msBrowserCode", async () => {
    let sCode = "";
    window = new BrowserWindow({
      frame: false,
      width: 960,
      height: 540,
      show: false,
    });
    await window.loadURL(LOGIN_START);
    return new Promise<string>((resolve, reject) => {
      window?.on("close", () => {
        if (sCode === "") {
          console.log("Unexpected window closing, what have you done?");
          reject();
        }
      });
      window?.webContents.on("did-stop-loading", () => {
        const url = window?.webContents.getURL();
        if (url?.startsWith("https://login.live.com/oauth20_desktop.srf")) {
          if (CODE_REGEX.test(url)) {
            console.log("Code found. Closing login window.");
            sCode = unescape((url.match(CODE_REGEX) || [])[0] || "");
            window?.close();
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
          window?.close();
          reject();
        } else {
          console.log("Not a callback URL, showing window...");
          window?.show();
        }
      });
    });
  });
}
