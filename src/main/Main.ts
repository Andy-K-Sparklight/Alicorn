import { app, BrowserWindow } from "electron";
import { loadConfig, saveConfig } from "./config/ConfigSupport";
import { initConcurrentDownloader } from "./download/Concurrent";
import os from "os";
import { whereJava } from "./java/WhereJava";

let mainWindow;

app.on("ready", async () => {
  await loadConfig();
  await initConcurrentDownloader();
  console.log(await whereJava());
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });
  mainWindow.loadFile("Renderer.html");
});

app.on("window-all-closed", async () => {
  await saveConfig();
  if (os.platform() !== "darwin") {
    app.quit();
  }
});
