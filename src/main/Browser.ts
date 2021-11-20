import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { getMainWindowUATrimmed } from "./Bootstrap";

let USER_BROWSER: BrowserWindow | null;
export const PRELOAD_FILE = "Starlight.js";
const BASE_URL = "https://www.mcbbs.net";

export async function openBrowser(
  nodeIntegration: boolean,
  proxy: string
): Promise<void> {
  console.log("Opening browser window!");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  USER_BROWSER = new BrowserWindow({
    webPreferences: {
      nodeIntegration: nodeIntegration,
      contextIsolation: false,
      sandbox: false,
      preload: path.resolve(app.getAppPath(), PRELOAD_FILE),
    },
    height: Math.floor(height * 0.7),
    width: Math.floor(width * 0.7),
    title: "Talking to the princess...",
    backgroundColor: "#fff",
  });
  USER_BROWSER.webContents.setUserAgent(getMainWindowUATrimmed());
  if (proxy.trim().length > 0) {
    await USER_BROWSER.webContents.session.setProxy({
      proxyRules: `${proxy}`,
    });
  } else {
    await USER_BROWSER.webContents.session.setProxy({ mode: "system" });
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
