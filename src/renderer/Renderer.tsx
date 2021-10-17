import { Box, createTheme, MuiThemeProvider } from "@material-ui/core";
import { ipcRenderer, shell } from "electron";
import { emptyDir } from "fs-extra";
import os from "os";
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import pkg from "../../package.json";
import { reloadAccounts } from "../modules/auth/AccountUtil";
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
import { loadAllMirrors, loadMirror } from "../modules/download/Mirror";
import { initResolveLock } from "../modules/download/ResolveLock";
import { loadJDT, preCacheJavaInfo } from "../modules/java/JInfo";
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
import { submitInfo, submitWarn } from "./Message";
import { initWorker } from "./Schedule";
import { initTranslator, tr } from "./Translator";
const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};

const WIN_FONT_FAMILY =
  '"UbuntuMono", "Microsoft YaHei UI", "Roboto Medium", "Trebuchet MS", "Segoe UI", SimHei, Tahoma, Geneva, Verdana, sans-serif';
const GNU_FONT_FAMILY =
  '"UbuntuMono", "Open Sans", "Roboto Medium", "Fira Code", Monaco, Consolas, "Courier New", Courier, monospace';
const FONT_FAMILY =
  os.platform() === "win32" ? WIN_FONT_FAMILY : GNU_FONT_FAMILY;
export function setThemeParams(
  primaryMain: string,
  primaryLight: string,
  secondaryMain: string,
  secondaryLight: string,
  fontFamily: string,
  overrideCursor?: boolean
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
    overrides: overrideCursor
      ? {
          MuiButtonBase: {
            root: {
              cursor: undefined,
            },
          },
          MuiInputBase: {
            root: {
              cursor: undefined,
            },
          },
          MuiCheckbox: {
            root: {
              cursor: undefined,
            },
          },
          MuiSelect: {
            select: {
              cursor: undefined,
            },
          },
          MuiFormControlLabel: {
            root: {
              cursor: undefined,
            },
          },
        }
      : undefined,
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
    overrides: overrideCursor
      ? {
          MuiButtonBase: {
            root: {
              cursor: undefined,
            },
          },
          MuiInputBase: {
            root: {
              cursor: undefined,
            },
          },
          MuiCheckbox: {
            root: {
              cursor: undefined,
            },
          },
          MuiSelect: {
            select: {
              cursor: undefined,
            },
          },
          MuiFormControlLabel: {
            root: {
              cursor: undefined,
            },
          },
        }
      : undefined,
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
console.log("Enabling V8 Compile cache.");
try {
  let vm = eval("require")("vm");
  if (vm) {
    eval("require")("v8-compile-cache");
    console.log("V8 Compile Cache Enabled.");
  } else {
    console.log("V8 Compile Cache Not Supported.");
  }
} catch {
  console.log("V8 Compile Cache Failed!");
}
printScreen("Log system enabled.");
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
printScreen("Setting up health trigger...");
printScreen("Configuring font size...");
configureFontSize();
printScreen("Setting up error pop system...");
window.addEventListener("unhandledrejection", (e) => {
  console.log(e.reason);
  printScreen(e.reason);
  showLogs();
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.reason }));
});

window.addEventListener("error", (e) => {
  console.log(e.message);
  printScreen(e.message);
  showLogs();
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.message }));
});

function flushColors(): void {
  setThemeParams(
    getString("theme.primary.main") || "#" + tr("Colors.Primary.Main"),
    getString("theme.primary.light") || "#" + tr("Colors.Primary.Light"),
    getString("theme.secondary.main") || "#" + tr("Colors.Secondary.Main"),
    getString("theme.secondary.light") || "#" + tr("Colors.Secondary.Light"),
    getConfiguredFont() + tr("Font") + FONT_FAMILY,
    getBoolean("features.cursor")
  );
  const e = document.createElement("style");
  e.innerText = `html {background-color:${
    getString("theme.secondary.light") || "#" + tr("Colors.Secondary.Light")
  }; font-family:${
    getConfiguredFont() + tr("Font") + FONT_FAMILY
  };} a {color:${getString("theme.primary.main", "#5d2391")};}`;
  // Set background
  document.head.insertAdjacentElement("beforeend", e);
  window.dispatchEvent(new CustomEvent("ForceRefreshApp"));
}

let normalCursorEle: HTMLStyleElement | null = null;
let pressCursorEle: HTMLStyleElement | null = null;
function setDefCursor(): void {
  if (getBoolean("features.cursor")) {
    if (pressCursorEle) {
      pressCursorEle.parentNode?.removeChild(pressCursorEle);
      pressCursorEle = null;
    }
    const x = normalCursorEle || document.createElement("style");
    x.innerText =
      'html, .MuiButtonBase-root, .MuiBox-root, label, button, input, input[type="text"], input[type="url"], input[type="checkbox"], input[type="radio"] { cursor: url(Mouse.png), auto !important; }';
    document.head.insertAdjacentElement("afterbegin", x);
    normalCursorEle = x;
  }
}
function setActCursor(): void {
  if (getBoolean("features.cursor")) {
    if (normalCursorEle) {
      normalCursorEle.parentNode?.removeChild(normalCursorEle);
      normalCursorEle = null;
    }
    const x = document.createElement("style");
    x.innerText =
      'html, .MuiButtonBase-root, .MuiBox-root, label, button, input, input[type="text"], input[type="url"], input[type="checkbox"], input[type="radio"] { cursor: url(Mouse2.png), auto !important; }';
    document.head.insertAdjacentElement("afterbegin", x);
    pressCursorEle = x;
  }
}

printScreen("Pre init works done, running main tasks.");
if (gc) {
  console.log("GC Enabled.");
} else {
  console.log("GC Disabled.");
}
const windowPos = window.localStorage.getItem("System.WindowPos");
const windowSize = window.localStorage.getItem("System.WindowSize");
if (windowSize) {
  const s = windowSize.split(",").map((r) => {
    return parseInt(r);
  });
  ipcRenderer.send("configureWindowSize", ...s);
}
if (windowPos) {
  const s = windowPos.split(",").map((r) => {
    return parseInt(r);
  });
  ipcRenderer.send("configureWindowPos", ...s);
}
ipcRenderer.on("mainWindowMoved", (_e, pos: number[]) => {
  window.localStorage.setItem("System.WindowPos", pos.join(","));
});
ipcRenderer.on("mainWindowResized", (_e, sz: number[]) => {
  window.localStorage.setItem("System.WindowSize", sz.join(","));
});
void (async () => {
  printScreen("Initializing translator...");
  await initTranslator();
  printScreen("Setting up link trigger...");
  // @ts-ignore
  window["ashow"] = (a: string) => {
    void shell.openExternal(a);
  }; // Binding
  printScreen("Loading config, gdt, jdt...");
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
  printScreen("Flushing theme colors...");
  flushColors();
  setDefCursor();
  if (getBoolean("features.cursor")) {
    window.addEventListener("mousedown", () => {
      setActCursor();
    });
    window.addEventListener("mouseup", () => {
      setDefCursor();
    });
  }
  printScreen("Initializing command listener...");
  initCommandListener();
  printScreen("Rendering main application...");
  try {
    ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
    clearScreen();
  } catch (e) {
    printScreen("ERR! " + String(e));
    throw e;
  }
  console.log("This Alicorn has super cow powers.");
  bindSuperCowPower();
  console.log("Initializing modules...");
  const t1 = new Date();
  await initWorker();
  registerHandlers();
  ipcRenderer.on("CallFromSleep", () => {
    submitInfo(tr("System.WakeUp"));
  });
  if (getBoolean("hot-key")) {
    activateHotKeyFeature();
  }
  // Essential works and light works
  await Promise.allSettled([initEncrypt()]);
  initDownloadWrapper();
  // Normal works
  await Promise.allSettled([
    (async () => {
      await loadMirror();
      await loadAllMirrors();
    })(),
    reloadAccounts(),
    initForgeInstallModule(),
    initConcurrentDownloader(),
    prepareAJ(),
    prepareND(),
    prepareEdgeExecutable(),
    loadServers(),
    getMachineUniqueID(), // Cache
  ]);
  // Heavy works and minor works
  await Promise.allSettled([initResolveLock(), initVF(), preCacheJavaInfo()]);
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
      } catch (e) {
        console.log(e);
        console.log(
          "A critical error happened during updating. Try again next time!"
        );
        submitWarn(tr("System.UpdateFailed"));
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

function printScreen(msg: string): void {
  // @ts-ignore
  window.logToScreen("<br/>" + msg);
}

function clearScreen(): void {
  // @ts-ignore
  window.clearLogScreen();
}
function showLogs(): void {
  // @ts-ignore
  window.showLogScreen();
}

function getConfiguredFont(): string {
  const s = getString("font-type");
  if (s.trim().length === 0 || s === "SysDefault") {
    return "";
  }
  return (s === "GNU" ? GNU_FONT_FAMILY : WIN_FONT_FAMILY) + ", ";
}
