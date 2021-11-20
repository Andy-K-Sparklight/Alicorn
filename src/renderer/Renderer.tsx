import { Box, createTheme, ThemeProvider, Typography } from "@mui/material";
import { ipcRenderer, shell } from "electron";
import { emptyDir } from "fs-extra";
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
import { setupMSAccountRefreshService } from "../modules/readyboom/AccountMaster";
import { setupHotProfilesService } from "../modules/readyboom/PrepareProfile";
import { initEncrypt } from "../modules/security/Encrypt";
import { getMachineUniqueID } from "../modules/security/Unique";
import { todayPing } from "../modules/selfupdate/Ping";
import { checkUpdate, initUpdator } from "../modules/selfupdate/Updator";
import { loadServers } from "../modules/server/ServerFiles";
import { App } from "./App";
import { completeFirstRun } from "./FirstRunSetup";
import { registerHandlers } from "./Handlers";
import { InstructionProvider } from "./Instruction";
import { submitInfo, submitWarn } from "./Message";
import { initWorker } from "./Schedule";
import { initStatistics } from "./Statistics";
import { AL_THEMES } from "./ThemeColors";
import { initTranslator, tr } from "./Translator";

try {
  console.log("Renderer first log.");
  printScreen("Setting up error pop system...");
  window.addEventListener("unhandledrejection", (e) => {
    ipcRenderer.send("SOS", e.reason);
    console.log(e);
    printScreen(e.reason);
    showLogs();
    window.dispatchEvent(new CustomEvent("sysError", { detail: e.reason }));
  });

  window.addEventListener("error", (e) => {
    ipcRenderer.send("SOS", e.message);
    console.log(e);
    printScreen(e.message);
    showLogs();
    window.dispatchEvent(new CustomEvent("sysError", { detail: e.message }));
  });
  const e1 = document.getElementById("boot_1");
  if (e1) {
    e1.innerHTML = e1.innerHTML + "Done.";
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

  printScreen("Pre init works done, running main tasks.");
  const e2 = document.getElementById("boot_2");
  if (e2) {
    e2.innerHTML = e2.innerHTML + "Done.";
  }
  if (gc) {
    console.log("GC Enabled.");
  } else {
    console.log("GC Disabled.");
  }
  const windowPos = localStorage.getItem("System.WindowPos");
  const windowSize = localStorage.getItem("System.WindowSize");
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
    localStorage.setItem("System.WindowPos", pos.join(","));
  });
  ipcRenderer.on("mainWindowResized", (_e, sz: number[]) => {
    localStorage.setItem("System.WindowSize", sz.join(","));
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
      localStorage.clear();
      await emptyDir(getActualDataPath("."));
      console.log("Stoarge data cleaned.");
      console.log("Resetting and reloading config...");
      await saveDefaultConfig();
      await loadConfig();
      ipcRenderer.send("reloadConfig");
      console.log("Reset complete.");
      console.log("Reloading window...");
      ipcRenderer.send("reload");
    }
    if (getBoolean("reset")) {
      console.log("Resetting and reloading config...");
      await saveDefaultConfig();
      await loadConfig();
      ipcRenderer.send("reloadConfig");
      console.log("Reset complete.");
      console.log("Reloading window...");
      ipcRenderer.send("reload");
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
    const e3 = document.getElementById("boot_3");
    if (e3) {
      e3.innerHTML = e3.innerHTML + "Done.";
    }
    try {
      ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
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
    // Essential works and light works
    await Promise.allSettled([initEncrypt()]);
    initDownloadWrapper();
    initStatistics();
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
    void completeFirstRun(); // Not blocking
    void todayPing();
    // Heavy works and minor works
    await Promise.allSettled([initResolveLock(), initVF(), preCacheJavaInfo()]);
    const t2 = new Date();
    console.log(
      "Delayed init tasks finished. Time elapsed: " +
        (t2.getTime() - t1.getTime()) / 1000 +
        "s."
    );
    // Deferred Check
    if (!navigator.onLine) {
      submitWarn(tr("System.Offline"));
    }
    // Optional services
    const t3 = new Date();
    console.log("Running optional services...");

    // Sync services
    setupMSAccountRefreshService();
    setupHotProfilesService();

    // Async services
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
} catch (e) {
  ipcRenderer.send("SOS", e);
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

function configureFontSize(): void {
  const f = "0.875em";
  console.log("Set small font size as " + f);
  sessionStorage.setItem("smallFontSize", f);
  let e: HTMLStyleElement | null = document.createElement("style");
  e.innerText = `.smtxt{font-size:${f} !important;} .MuiTooltip-tooltip > .smtxt{font-size: 1.2em !important;}`;
  document.head.insertAdjacentElement("beforeend", e);
  e = null;
}

function printScreen(msg: string): void {
  // @ts-ignore
  window.logToScreen("<br/>" + msg);
}

function showLogs(): void {
  // @ts-ignore
  window.showLogScreen();
}
function getTheme() {
  const selected = getString("theme");
  let t;
  if (AL_THEMES[selected] !== undefined) {
    t = AL_THEMES[selected];
  } else {
    t = AL_THEMES[tr("PrefTheme")];
  }
  return t;
}

export function isBgDark(): boolean {
  const selected = getString("theme");
  let t;
  if (AL_THEMES[selected] !== undefined) {
    t = selected;
  } else {
    t = tr("PrefTheme");
  }
  return t.includes("Dark");
}

function flushColors(): void {
  const t = getTheme();
  setThemeParams(
    getString("theme.primary.main") || "#" + t[0],
    getString("theme.primary.light") || "#" + t[1],
    getString("theme.secondary.main") || "#" + t[2],
    getString("theme.secondary.light") || "#" + t[3],
    FONT_FAMILY,
    getBoolean("features.cursor")
  );
  let e: HTMLStyleElement | null = document.createElement("style");
  e.innerText =
    `html {background-color:${
      getString("theme.secondary.light") || "#" + getTheme()[3]
    }; font-family:${tr("Font") + FONT_FAMILY};} a {color:${
      getString("theme.primary.main") || "#" + getTheme()[0]
    } !important;} ` +
    (isBgDark()
      ? `input, label {color:${
          getString("theme.primary.main") || "#" + getTheme()[0]
        } !important;} fieldset {border-color:${
          getString("theme.primary.main") || "#" + getTheme()[0]
        } !important;} div[role="radiogroup"] > label > span > span > div > svg, input[type="checkbox"] + svg, .MuiFormControlLabel-label .MuiInputBase-input {color: ${
          getString("theme.primary.main") || "#" + getTheme()[0]
        } !important;}`
      : "");
  // Set background
  document.head.insertAdjacentElement("beforeend", e);
  e = null;
  window.dispatchEvent(new CustomEvent("ForceRefreshApp"));
}

const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};

const FONT_FAMILY =
  '"Ubuntu Mono", Consolas, "Courier New", Courier, "Source Hans Sans", "Roboto Medium", "Microsoft YaHei", "Segoe UI", SimHei, Tahoma, Geneva, Verdana, sans-serif';

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
      mode: "light",
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
    components: overrideCursor
      ? {
          MuiButtonBase: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
          MuiCheckbox: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              select: {
                cursor: undefined,
              },
            },
          },
          MuiFormControlLabel: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
        }
      : {},
  });
  ALICORN_DEFAULT_THEME_DARK = createTheme({
    palette: {
      mode: "dark",
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
    components: overrideCursor
      ? {
          MuiButtonBase: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
          MuiCheckbox: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              select: {
                cursor: undefined,
              },
            },
          },
          MuiFormControlLabel: {
            styleOverrides: {
              root: {
                cursor: undefined,
              },
            },
          },
        }
      : {},
  });
}

export let ALICORN_DEFAULT_THEME_DARK = createTheme({
  palette: {
    mode: "dark",
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
    mode: "light",
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
let normalCursorEle: HTMLStyleElement | null = null;
let pressCursorEle: HTMLStyleElement | null = null;
function setDefCursor(): void {
  if (getBoolean("features.cursor")) {
    if (pressCursorEle) {
      pressCursorEle.parentNode?.removeChild(pressCursorEle);
      pressCursorEle = null;
    }
    let x: HTMLStyleElement | null =
      normalCursorEle || document.createElement("style");
    x.innerText =
      'html, .MuiButtonBase-root, .MuiBox-root, label, button, input, input[type="text"], input[type="url"], input[type="checkbox"], input[type="radio"] { cursor: url(Mouse.png), auto !important; }';
    document.head.insertAdjacentElement("afterbegin", x);
    normalCursorEle = x;
    x = null;
  }
}

function setActCursor(): void {
  if (getBoolean("features.cursor")) {
    if (normalCursorEle) {
      normalCursorEle.parentNode?.removeChild(normalCursorEle);
      normalCursorEle = null;
    }
    let x: HTMLStyleElement | null = document.createElement("style");
    x.innerText =
      'html, .MuiButtonBase-root, .MuiBox-root, label, button, input, input[type="text"], input[type="url"], input[type="checkbox"], input[type="radio"] { cursor: url(Mouse2.png), auto !important; }';
    document.head.insertAdjacentElement("afterbegin", x);
    pressCursorEle = x;
    x = null;
  }
}
function RendererBootstrap(): JSX.Element {
  return (
    <Box
      style={Object.assign(GLOBAL_STYLES, {
        backgroundColor:
          getString("theme.secondary.light") || "#" + getTheme()[3],
      })}
    >
      <InstructionProvider>
        <ThemeProvider theme={ALICORN_DEFAULT_THEME_DARK}>
          <HashRouter>
            <App />
          </HashRouter>
          {getString("theme") === "Random" ? (
            <Typography
              sx={{
                pointerEvents: "none",
                position: "fixed",
                left: "0.3125em",
                bottom: "0.3125em",
              }}
              color={"textPrimary"}
            >
              {AL_THEMES["Random"].join(",")}
            </Typography>
          ) : (
            ""
          )}

          <Typography
            sx={{
              pointerEvents: "none",
              position: "fixed",
              right: "0.3125em",
              bottom: "0.3125em",
            }}
            color={"primary"}
          >
            {"Alicorn " + pkg.appVersion + " #" + pkg.updatorVersion}
          </Typography>
        </ThemeProvider>
      </InstructionProvider>
    </Box>
  );
}
