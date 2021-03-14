import { app, BrowserWindow } from "electron";
import { loadConfig } from "./config/ConfigSupport";
import { initConcurrentDownloader } from "./download/Concurrent";

let mainWindow;

app.on("ready", async () => {
  await loadConfig();
  await initConcurrentDownloader();
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });
  mainWindow.loadFile("Renderer.html");
});
