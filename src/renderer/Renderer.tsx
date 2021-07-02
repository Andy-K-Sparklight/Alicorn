import React from "react";
import ReactDOM from "react-dom";
import { initTranslator } from "./Translator";
import { Box, createMuiTheme, MuiThemeProvider } from "@material-ui/core";
import {
  getBoolean,
  loadConfig,
  saveDefaultConfig,
} from "../modules/config/ConfigSupport";
import { loadGDT } from "../modules/container/ContainerUtil";
import { loadJDT } from "../modules/java/JInfo";
import { initEncrypt } from "../modules/security/Encrypt";
import { loadMirror } from "../modules/download/Mirror";
import { initConcurrentDownloader } from "../modules/download/Concurrent";
import { initDownloadWrapper } from "../modules/download/DownloadWrapper";
import { initModInfo } from "../modules/modx/ModInfo";
import { initForgeInstallModule } from "../modules/pff/install/ForgeInstall";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { initVF } from "../modules/container/ValidateRecord";
import { prepareAJ } from "../modules/auth/AJHelper";
import pkg from "../../package.json";
import { registerHandlers } from "./Handlers";
import { initResolveLock } from "../modules/download/ResolveLock";
import { prepareND } from "../modules/auth/NDHelper";
import { saveJIMFile } from "../modules/launch/JIMSupport";
import { ipcRenderer } from "electron";

require("v8-compile-cache");

const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};

export const ALICORN_DEFAULT_THEME_DARK = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#5d2391",
      light: "#d796f0",
    },
    secondary: {
      main: "#df307f",
      light: "#ffe0f0",
    },
  },
});
export const ALICORN_DEFAULT_THEME_LIGHT = createMuiTheme({
  palette: {
    type: "light",
    primary: {
      main: "#5d2391",
      light: "#d796f0",
    },
    secondary: {
      main: "#df307f",
      light: "#ffe0f0",
    },
  },
});

function RendererBootstrap(): JSX.Element {
  return (
    <Box style={GLOBAL_STYLES}>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_DARK}>
        <HashRouter>
          <App />
        </HashRouter>
      </MuiThemeProvider>
    </Box>
  );
}

console.log(`Alicorn ${pkg.appVersion} Renderer Process`);
console.log("❤ From Andy K Rarity Sparklight");
console.log("Sparklight is a girl - a filly, to be accurate.");
console.log("Alicorn Launcher Copyright (C) 2021 Andy K Rarity Sparklight");
console.log(
  "This program comes with ABSOLUTELY NO WARRANTY; for details, please see 'resources/app/LICENSE'."
);
console.log(
  "This is free software, and you are welcome to redistribute it under certain conditions; see the license file for details."
);

initTranslator();

window.addEventListener("unhandledrejection", (e) => {
  console.log(e.reason);
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.reason }));
});

window.addEventListener("error", (e) => {
  console.log(e.message);
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.message }));
});

(async () => {
  await loadConfig(); // This comes first
  if (getBoolean("reset")) {
    console.log("Resetting and reloading config...");
    await saveDefaultConfig();
    await loadConfig();
    ipcRenderer.send("reloadConfig");
    console.log("Reset complete.");
  }
  ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
  console.log("Initializing modules...");
  const t1 = new Date();
  registerHandlers();
  // Essential works and light works
  await Promise.allSettled([
    loadGDT(),
    loadJDT(),
    initEncrypt(),
    initModInfo(),
  ]);
  initDownloadWrapper();
  // Normal works
  await Promise.allSettled([
    saveJIMFile(),
    loadMirror(),
    initForgeInstallModule(),
    initConcurrentDownloader(),
    prepareAJ(),
    prepareND(),
  ]);
  // Heavy works and minor works
  await Promise.allSettled([initResolveLock(), initVF()]);
  const t2 = new Date();
  console.log(
    "Delayed init tasks finished. Time elapsed: " +
      (t2.getTime() - t1.getTime()) / 1000 +
      "s."
  );
})();

export function submitError(msg: string): void {
  console.log(msg);
  window.dispatchEvent(new CustomEvent("sysError", { detail: msg }));
}
