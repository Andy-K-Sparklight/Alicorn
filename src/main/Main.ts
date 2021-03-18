import { app, BrowserWindow } from "electron";
import { loadConfig, saveConfig } from "./config/ConfigSupport";
import { initConcurrentDownloader } from "./download/Concurrent";
import os from "os";
import path from "path";

let mainWindow;

app.on("ready", async () => {
  await loadConfig();
  await initConcurrentDownloader();
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve("Preload.js"),
    },
  });
  mainWindow.loadFile("Renderer.html");
  mainWindow.webContents.openDevTools();
});

app.on("window-all-closed", async () => {
  await saveConfig();
  if (os.platform() !== "darwin") {
    app.quit();
  }
});
