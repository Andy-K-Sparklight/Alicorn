import { app, BrowserWindow } from "electron";
import { loadConfig, saveConfig } from "./config/ConfigSupport";
import { initConcurrentDownloader } from "./download/Concurrent";
import os from "os";
import path from "path";
import { loadGDT, saveGDT } from "./container/Container";
import { loadMirror, saveMirror } from "./download/Mirror";
import { GameProfile } from "./profile/GameProfile";
import fs from "fs-extra";
import { ensureNatives } from "./launch/Ensurance";
import { MinecraftContainer } from "./container/MinecraftContainer";

let mainWindow;

app.on("ready", async () => {
  await loadConfig();
  await loadGDT();
  await loadMirror();
  await initConcurrentDownloader();

  const testProfile = new GameProfile(
    await fs.readJSON("F:/.minecraft/versions/1.16.5/1.16.5.json")
  );
  await ensureNatives(
    testProfile,
    new MinecraftContainer("F:/.minecraft", "P:")
  );

  mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    webPreferences: {
      preload: path.resolve("Preload.js"),
    },
  });
  mainWindow.loadFile("Renderer.html");
  mainWindow.webContents.openDevTools();
});

app.on("window-all-closed", async () => {
  if (os.platform() !== "darwin") {
    app.quit();
  }
});
app.on("will-quit", async () => {
  await saveConfig();
  await saveGDT();
  await saveMirror();
});
