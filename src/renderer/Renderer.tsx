import { Box, createTheme, MuiThemeProvider } from "@material-ui/core";
import { ipcRenderer, shell } from "electron";
import { emptyDir } from "fs-extra";
import os from "os";
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import pkg from "../../package.json";
import { prepareAJ } from "../modules/auth/AJHelper";
import { prepareND } from "../modules/auth/NDHelper";
import { initCommandListener } from "../modules/command/CommandListener";
import {
  getBoolean,
  getString,
  loadConfig,
  saveDefaultConfig,
} from "../modules/config/ConfigSupport";
import { getActualDataPath } from "../modules/config/DataSupport";
import { loadGDT } from "../modules/container/ContainerUtil";
import { initVF } from "../modules/container/ValidateRecord";
import { prepareEdgeExecutable } from "../modules/cutie/BootEdge";
import { initConcurrentDownloader } from "../modules/download/Concurrent";
import { initDownloadWrapper } from "../modules/download/DownloadWrapper";
import { loadMirror } from "../modules/download/Mirror";
import { initResolveLock } from "../modules/download/ResolveLock";
import { loadJDT } from "../modules/java/JInfo";
import { initModInfo } from "../modules/modx/ModInfo";
import { prefetchFabricManifest } from "../modules/pff/get/FabricGet";
import { prefetchForgeManifest } from "../modules/pff/get/ForgeGet";
import { prefetchMojangVersions } from "../modules/pff/get/MojangCore";
import { initForgeInstallModule } from "../modules/pff/install/ForgeInstall";
import { initEncrypt } from "../modules/security/Encrypt";
import { getMachineUniqueID } from "../modules/security/Unique";
import { checkUpdate, initUpdator } from "../modules/selfupdate/Updator";
import { loadServers } from "../modules/server/ServerFiles";
import { App } from "./App";
import { registerHandlers } from "./Handlers";
import { activateHotKeyFeature } from "./HotKeyHandler";
import { initWorker } from "./Schedule";
import { initTranslator } from "./Translator";
const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};
/*
CLAIM FOR EXTERNAL RESOURCE

Any font present is NOT a part of Alicorn and might not be licensed under a free software license. These fonts are only a component of ON OF the DIRTRIBUTIONS of Alicorn.

However, distributions is not maintained by Alicorn Official (or PinkAX), and we DO NOT guarantee they are always free as in freedom. Based on friendship, we keep a copy in our repo, but that DOESN NOT MEAN they are a part of Alicorn.

Alicorn have them packaged for a better display performance, but it IS NOT necessary for Alicorn to run, simply remove them, and you will have an free Alicorn.

However, even if it is a controversial evil, it is still a kind of evil. We will try our best to replace those non-free fonts - as soon as possible.
*/
const WIN_FONT_FAMILY =
  'Consolas, "Microsoft YaHei UI", "Roboto Medium", "Trebuchet MS", "Segoe UI", SimHei, Tahoma, Geneva, Verdana, sans-serif';
const GNU_FONT_FAMILY =
  '"UbuntuMono", "Open Sans", "Roboto Medium", "Fira Code", Monaco, Consolas, "Courier New", Courier, monospace';
const FONT_FAMILY =
  os.platform() === "win32" ? WIN_FONT_FAMILY : GNU_FONT_FAMILY;
export function setThemeParams(
  primaryMain: string,
  primaryLight: string,
  secondaryMain: string,
  secondaryLight: string,
  fontFamily: string
): void {
  ALICORN_DEFAULT_THEME_LIGHT = createTheme({
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
    typography: {
      fontFamily: fontFamily,
    },
  });
  ALICORN_DEFAULT_THEME_DARK = createTheme({
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
    typography: {
      fontFamily: fontFamily,
    },
  });
}

export let ALICORN_DEFAULT_THEME_DARK = createTheme({
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
  typography: {
    fontFamily: FONT_FAMILY,
  },
});
export let ALICORN_DEFAULT_THEME_LIGHT = createTheme({
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
  typography: {
    fontFamily: FONT_FAMILY,
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
configureFontSize();
window.addEventListener("unhandledrejection", (e) => {
  console.log(e.reason);
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.reason }));
});

window.addEventListener("error", (e) => {
  console.log(e.message);
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.message }));
});

void (async () => {
  await initTranslator();
  // @ts-ignore
  window["ashow"] = (a: string) => {
    void shell.openExternal(a);
  }; // Binding
  await Promise.allSettled([loadConfig(), loadGDT(), loadJDT()]);
  // GDT & JDT is required by LaunchPad & JavaSelector
  if (getBoolean("clean-storage")) {
    console.log("Cleaning storage data!");
    window.localStorage.clear();
    await emptyDir(getActualDataPath("."));
    console.log("Stoarge data cleaned.");
    console.log("Resetting and reloading config...");
    await saveDefaultConfig();
    await loadConfig();
    ipcRenderer.send("reloadConfig");
    console.log("Reset complete.");
    console.log("Reloading window...");
    window.location.reload();
  }
  if (getBoolean("reset")) {
    console.log("Resetting and reloading config...");
    await saveDefaultConfig();
    await loadConfig();
    ipcRenderer.send("reloadConfig");
    console.log("Reset complete.");
    console.log("Reloading window...");
    window.location.reload();
  }
  setThemeParams(
    getString("theme.primary.main", "#5d2391"),
    getString("theme.primary.light", "#d796f0"),
    getString("theme.secondary.main", "#df307f"),
    getString("theme.secondary.light", "#ffe0f0"),
    (getString("font-style", "Regular") === "Regular" ? "" : "CutieX, ") +
      FONT_FAMILY
  );
  const e = document.createElement("style");
  e.innerText = `html {background-color:${getString(
    "theme.secondary.light",
    "#ffe0f0"
  )};} a {color:${getString("theme.primary.main", "#5d2391")};}`;
  // Set background
  document.head.insertAdjacentElement("beforeend", e);
  initCommandListener();
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
    loadMirror(),
    initForgeInstallModule(),
    initConcurrentDownloader(),
    prepareAJ(),
    prepareND(),
    prepareEdgeExecutable(),
    loadServers(),
    getMachineUniqueID(), // Cache
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
  const updPm = (async () => {
    // Conc
    if (getBoolean("updator.use-update")) {
      console.log("Checking updates...");
      try {
        initUpdator();
        await checkUpdate();
        console.log("Update check completed!");
      } catch (e) {
        console.log(e);
        console.log(
          "A critical error happened during updating. Try again next time!"
        );
      }
    } else {
      console.log("Skipped update checking due to user settings.");
    }
  })();

  await Promise.allSettled([
    updPm,
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

function configureFontSize(): void {
  // const f = (document.body.clientWidth / 60).toString() + "px";
  const f = "14px";
  console.log("Set small font size as " + f);
  window.sessionStorage.setItem("smallFontSize", f);
}
