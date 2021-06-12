import { app, BrowserWindow } from "electron";
import path from "path";

let USER_BROWSER: BrowserWindow | null;
export const PRELOAD_FILE = "Starlight.js";
const BASE_URL = "https://www.mcbbs.net";

export async function openBrowser(
  nodeIntegration: boolean,
  proxy: string
): Promise<void> {
  console.log("Opening browser window!");
  USER_BROWSER = new BrowserWindow({
    webPreferences: {
      nodeIntegration: nodeIntegration,
      contextIsolation: false,
      sandbox: false,
      preload: path.resolve(app.getAppPath(), PRELOAD_FILE),
      enableRemoteModule: false,
    },
    height: 720,
    width: 1280,
    title: "Please Wait...",
  });
  if (proxy.trim().length > 0) {
    await USER_BROWSER.webContents.session.setProxy({
      proxyRules: `${proxy},direct://`,
    });
  }
  USER_BROWSER.setMenu(null);
  // XXX This is not recommended
  USER_BROWSER.on("close", () => {
    USER_BROWSER?.destroy();
  });
  USER_BROWSER.show();
  USER_BROWSER.webContents.openDevTools();
  try {
    await USER_BROWSER.loadURL(BASE_URL);
  } catch {}
}

export function getUserBrowser(): BrowserWindow | null {
  return USER_BROWSER;
}
