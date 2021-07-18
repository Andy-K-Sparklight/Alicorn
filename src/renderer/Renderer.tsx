import { Box, createMuiTheme, MuiThemeProvider } from "@material-ui/core";
import { ipcRenderer } from "electron";
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import pkg from "../../package.json";
import { prepareAJ } from "../modules/auth/AJHelper";
import { prepareND } from "../modules/auth/NDHelper";
import {
  getBoolean,
  getString,
  loadConfig,
  saveDefaultConfig,
} from "../modules/config/ConfigSupport";
import { loadGDT } from "../modules/container/ContainerUtil";
import { initVF } from "../modules/container/ValidateRecord";
import { DownloadMeta } from "../modules/download/AbstractDownloader";
import { initConcurrentDownloader } from "../modules/download/Concurrent";
import {
  initDownloadWrapper,
  wrappedDownloadFile,
} from "../modules/download/DownloadWrapper";
import { loadMirror } from "../modules/download/Mirror";
import { initResolveLock } from "../modules/download/ResolveLock";
import { loadJDT } from "../modules/java/JInfo";
import { saveJIMFile } from "../modules/launch/JIMSupport";
import { initModInfo } from "../modules/modx/ModInfo";
import { prefetchFabricManifest } from "../modules/pff/get/FabricGet";
import { prefetchForgeManifest } from "../modules/pff/get/ForgeGet";
import { prefetchMojangVersions } from "../modules/pff/get/MojangCore";
import { initForgeInstallModule } from "../modules/pff/install/ForgeInstall";
import { initEncrypt } from "../modules/security/Encrypt";
import { App } from "./App";
import { registerHandlers } from "./Handlers";
import { activateHotKeyFeature } from "./HotKeyHandler";
import { initWorker } from "./Schedule";
import { initTranslator } from "./Translator";

const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};

export function setThemeColor(
  primaryMain: string,
  primaryLight: string,
  secondaryMain: string,
  secondaryLight: string
): void {
  ALICORN_DEFAULT_THEME_DARK = createMuiTheme({
    palette: {
      type: "dark",
      primary: {
        main: primaryMain,
        light: primaryLight,
      },
      secondary: {
        main: secondaryMain,
        light: secondaryLight,
      },
    },
  });
  ALICORN_DEFAULT_THEME_LIGHT = createMuiTheme({
    palette: {
      type: "light",
      primary: {
        main: primaryMain,
        light: primaryLight,
      },
      secondary: {
        main: secondaryMain,
        light: secondaryLight,
      },
    },
  });
}

export let ALICORN_DEFAULT_THEME_DARK = createMuiTheme({
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
export let ALICORN_DEFAULT_THEME_LIGHT = createMuiTheme({
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
    <Box
      style={Object.assign(GLOBAL_STYLES, {
        backgroundColor: getString("theme.secondary.light", "#ffe0f0"),
      })}
    >
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
  await Promise.allSettled([loadConfig(), loadGDT(), loadJDT()]);
  // GDT & JDT is required by LaunchPad & JavaSelector
  if (getBoolean("reset")) {
    console.log("Resetting and reloading config...");
    await saveDefaultConfig();
    await loadConfig();
    ipcRenderer.send("reloadConfig");
    console.log("Reset complete.");
  }
  setThemeColor(
    getString("theme.primary.main", "#5d2391"),
    getString("theme.primary.light", "#d796f0"),
    getString("theme.secondary.main", "#df307f"),
    getString("theme.secondary.light", "#ffe0f0")
  );
  const e = document.createElement("style");
  e.innerText = `html {background-color:${getString(
    "theme.secondary.light",
    "#ffe0f0"
  )};}`;
  // Set background
  document.head.insertAdjacentElement("beforeend", e);
  ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
  console.log("This Alicorn has super cow powers.");
  bindSuperCowPower();
  console.log("Initializing modules...");
  const t1 = new Date();
  await initWorker();
  registerHandlers();
  if (getBoolean("hot-key")) {
    activateHotKeyFeature();
  }
  // Essential works and light works
  await Promise.allSettled([initEncrypt(), initModInfo()]);
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
  // Optional services
  const t3 = new Date();
  console.log("Running optional services...");
  await Promise.allSettled([
    prefetchForgeManifest(),
    prefetchFabricManifest(),
    prefetchMojangVersions(),
  ]);
  const t4 = new Date();
  console.log(
    "Optional services finished. Time elapsed: " +
      (t4.getTime() - t3.getTime()) / 1000 +
      "s."
  );
})();

export function submitError(msg: string): void {
  console.log(msg);
  window.dispatchEvent(new CustomEvent("sysError", { detail: msg }));
}

function bindSuperCowPower(): void {
  // @ts-ignore
  window["moo"] = () => {
    console.log(
      "                 (__) \n" +
        "                 (oo) \n" +
        "           /------\\/ \n" +
        "          / |    ||   \n" +
        "         *  /\\---/\\ \n" +
        "            ~~   ~~   \n" +
        '..."Have you mooed today?"...'
    );
  };
  // @ts-ignore
  window["moomoo"] = () => {
    console.log(
      "                 (__)  \n" +
        "         _______~(..)~ \n" +
        "           ,----\\(oo) \n" +
        "          /|____|,'    \n" +
        '         * /"\\ /\\   \n' +
        "           ~ ~ ~ ~     \n" +
        '..."Have you mooed today?"...'
    );
  }; // @ts-ignore
  window["moomoomoo"] = () => {
    console.log(
      "                     \\_/ \n" +
        "   m00h  (__)       -(_)- \n" +
        "      \\  ~Oo~___     / \\\n" +
        "         (..)  |\\        \n" +
        "___________|_|_|_____________\n" +
        '..."Have you mooed today?"...'
    );
  };
}
