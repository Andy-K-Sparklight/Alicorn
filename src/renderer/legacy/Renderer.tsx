import { Box, createTheme, ThemeProvider, Typography } from "@mui/material";
import { NextUIProvider } from "@nextui-org/react";
import { ipcRenderer, shell } from "electron";
import { emptyDir } from "fs-extra";
import path from "path";
import React from "react";
import { createRoot } from "react-dom/client";
import pkg from "../../package.json";
import { registerBossKey } from "@/modules/access/BossKey";
import { reloadAccounts } from "@/modules/auth/AccountUtil";
import { prepareAJ } from "@/modules/auth/AJHelper";
import { prepareND } from "@/modules/auth/NDHelper";
import { getBoolean, getNumber, getString, loadConfig, saveDefaultConfig } from "@/modules/config/ConfigSupport";
import { getActualDataPath } from "@/modules/config/DataSupport";
import { loadGDT } from "@/modules/container/ContainerUtil";
import { initVF } from "@/modules/container/ValidateRecord";
import { initConcurrentDownloader } from "@/modules/download/Concurrent";
import { initDownloadWrapper } from "@/modules/download/DownloadWrapper";
import { loadAllMirrors, loadMirror } from "@/modules/download/Mirror";
import { loadJDT, preCacheJavaInfo } from "@/modules/java/JavaInfo";
import { prefetchForgeManifest } from "@/modules/pff/get/ForgeGet";
import { prefetchMojangVersions } from "@/modules/pff/get/MojangCore";
import { initForgeInstallModule } from "@/modules/pff/install/ForgeInstall";
import { setupMSAccountRefreshService } from "@/modules/readyboom/AccountMaster";
import { setupHotProfilesService } from "@/modules/readyboom/PrepareProfile";
import { initEncrypt } from "@/modules/security/Encrypt";
import { getMachineUniqueID } from "@/modules/security/Unique";
import { todayPing } from "@/modules/selfupdate/Ping";
import { checkUpdate, initUpdator } from "@/modules/selfupdate/Updator";
import { AppLegacy } from "./AppLegacy";
import { completeFirstRun } from "./FirstRunSetup";
import { InstructionProvider } from "./Instruction";
import { submitError, submitWarn } from "./Message";
import { initWorker } from "./Schedule";
import { initStatistics } from "./Statistics";
import { AL_THEMES } from "./ThemeColors";
import { initTranslator, loadTips, tr } from "./Translator";
import { initValueEventsFromMain } from "./ValueCenter";
import { i18n } from "./i18n/i18n";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import "./global.css";
import "@fontsource/ubuntu-mono";
import "@fontsource/noto-sans-sc";

try {
    console.log("Renderer first log.");
    console.log("Configuring window...");
    const t0 = new Date();
    printScreen("Setting up error pop system...");
    window.addEventListener("unhandledrejection", (e) => {
        submitError("ERR! " + e.reason);
        console.log(e);
        printScreen(e.reason);
        showLogs();
        window.dispatchEvent(new CustomEvent("sysError", { detail: e.reason }));
    });

    window.addEventListener("error", (e) => {
        submitError("ERR! " + e.message);
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
    console.log(`Alicorn ${pkg.codename} Renderer Process`);
    console.log("%c❤ From Annie K Rarity Sparklight", "color:#df307f;");
    console.log(
        "%cSparklight is a girl - a filly, to be accurate.",
        "color:#df307f;"
    );
    console.log("Life is better if you stay away from 'slime-liked' Forge.");
    console.log(
        "%cStay with Fabric, stay with performance.",
        "font-weight:bold;"
    );
    console.log("%cDedicated to Linus Torvalds and FSF.", "font-weight:bold;");
    console.log(
        "Copyright (C) 2021-2022 Annie K Rarity Sparklight"
    );
    console.log(
        "Copyright (C) 2024 Ted \"skjsjhb\" Gao"
    );

    console.log(
        "This program comes with ABSOLUTELY NO WARRANTY; for details, please see 'resources/app/LICENSE'."
    );
    console.log(
        "This is free software, and you are welcome to redistribute it under certain conditions; see the license file for details."
    );
    printScreen("Pre init works done, running main tasks.");
    const e2 = document.getElementById("boot_2");
    if (e2) {
        e2.innerHTML = e2.innerHTML + "Done.";
    }
    initValueEventsFromMain();

    // Native setup routine
    const serial = Math.floor(Math.random() * 100);
    if (await native.dev.ping(serial) != serial + 1) {
        throw "Unable to connect to background API services";
    }
    console.log("Connected to background.");

    native.bwctl.show(); // Show the window

    void (async () => {
        printScreen("Loading lang, config, gdt, jdt...");
        await Promise.allSettled([
            initTranslator(),
            i18n.init(),
            loadTips(),
            loadConfig(),
            loadGDT(),
            loadJDT()
        ]);
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
            console.log("Reset complete.");
            console.log("Reloading window...");
            ipcRenderer.send("reload");
        }
        printScreen("Rendering main application...");
        const e3 = document.getElementById("boot_3");
        if (e3) {
            e3.innerHTML = e3.innerHTML + "Done.";
        }
        printScreen("Flushing theme colors...");
        flushColors();
        try {
            const r = document.getElementById("root");
            if (r) {
                const root = createRoot(r);
                root.render(<RendererBootstrap/>);
            }
        } catch (e) {
            printScreen("ERR! " + String(e));
            throw e;
        }
        printScreen("Configuring font size...");
        configureFontSize();
        printScreen("Setting up link trigger...");
        // @ts-ignore
        window["ashow"] = (a: string) => {
            void shell.openExternal(a);
        }; // Binding

        console.log("This Alicorn has super cow powers.");
        bindSuperCowPower();

        console.log(
            "Render complete, time elapsed: " +
            (new Date().getTime() - t0.getTime()) / 1000 +
            "s."
        );
        console.log("Initializing modules...");
        const t1 = new Date();
        await initWorker();
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
            getMachineUniqueID() // Cache
        ]);
        void completeFirstRun(); // Not blocking
        void todayPing();
        registerBossKey();
        // Heavy works and minor works
        await Promise.allSettled([initVF(), preCacheJavaInfo()]);
        const t2 = new Date();
        console.log(
            "Delayed init tasks finished. Time elapsed: " +
            (t2.getTime() - t1.getTime()) / 1000 +
            "s."
        );
        console.log(
            "%c" + tr("System.DevToolsWarn1"),
            "font-size:3.5rem;color:royalblue;font-weight:900;"
        );
        console.log("%c" + tr("System.DevToolsWarn2"), "font-size:1rem;color:red;");
        console.log("%c" + tr("System.DevToolsWarn3"), "font-size:2rem;color:red;");
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
            prefetchMojangVersions()
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
            "...\"Have you mooed today?\"..."
        );
    };
    // @ts-ignore
    window["moomoo"] = () => {
        console.log(
            "                 (__)  \n" +
            "         _______~(..)~ \n" +
            "           ,----\\(oo) \n" +
            "          /|____|,'    \n" +
            "         * /\"\\ /\\   \n" +
            "           ~ ~ ~ ~     \n" +
            "...\"Have you mooed today?\"..."
        );
    }; // @ts-ignore
    window["moomoomoo"] = () => {
        console.log(
            "                     \\_/ \n" +
            "   m00h  (__)       -(_)- \n" +
            "      \\  ~Oo~___     / \\\n" +
            "         (..)  |\\        \n" +
            "___________|_|_|_____________\n" +
            "...\"Have you mooed today?\"..."
        );
    };
}

function configureFontSize(): void {
    const f = "0.875rem";
    console.log("Set small font size as " + f);
    sessionStorage.setItem("smallFontSize", f);
    let e: HTMLStyleElement | null = document.createElement("style");
    e.innerText = `.smtxt{font-size:${f} !important;}`;
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
        FONT_FAMILY
    );
    let e: HTMLStyleElement | null = document.createElement("style");
    e.innerText =
        `html {background-color:${
            getString("theme.secondary.light") || "#" + getTheme()[3]
        } !important; font-family:${FONT_FAMILY};} a {color:${
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
    if (getBoolean("features.sword")) {
        e.innerText += " * {cursor: url(Cursor.png), pointer !important;}";
    }
    document.head.insertAdjacentElement("beforeend", e);
    e = null;
    window.dispatchEvent(new CustomEvent("ForceRefreshApp"));
}

const FONT_FAMILY =
    "\"Ubuntu Mono\", Consolas, \"Courier New\", Courier, \"Noto Sans SC\", \"Roboto Medium\", \"Microsoft YaHei\", \"Segoe UI\", SimHei, Tahoma, Geneva, Verdana, sans-serif";

function setThemeParams(
    primaryMain: string,
    primaryLight: string,
    secondaryMain: string,
    secondaryLight: string,
    fontFamily: string
): void {
    ALICORN_DEFAULT_THEME_LIGHT = createTheme({
        palette: {
            mode: "light",
            primary: {
                main: primaryMain,
                light: primaryLight
            },
            secondary: {
                main: secondaryMain,
                light: secondaryLight
            }
        },
        typography: {
            fontFamily: fontFamily,
            fontSize: 14
        }
    });
    ALICORN_DEFAULT_THEME_DARK = createTheme({
        palette: {
            mode: "dark",
            primary: {
                main: primaryMain,
                light: primaryLight
            },
            secondary: {
                main: secondaryMain,
                light: secondaryLight
            }
        },
        typography: {
            fontFamily: fontFamily,
            fontSize: 14
        }
    });
}

export let ALICORN_DEFAULT_THEME_DARK: any;
export let ALICORN_DEFAULT_THEME_LIGHT: any;

const BACKGROUND_URLS: Record<string, string> = {
    ACG: "https://api.ixiaowai.cn/api/api.php",
    Bing: "https://api.oick.cn/bing/api.php",
    Disabled: "",
    "": ""
};

function RendererBootstrap(): JSX.Element {
    let url =
        getString("theme.background.custom") || getString("theme.background");
    if (url === "Disabled" || !url) {
        url = "";
    } else {
        url = BACKGROUND_URLS[url] || url;
        if (path.isAbsolute(url)) {
            url = "file://" + url;
        }
    }
    return (
        <Box
            style={{
                userSelect: "none",
                backgroundColor:
                    getString("theme.secondary.light") || "#" + getTheme()[3]
            }}
        >
            <InstructionProvider>
                <ThemeProvider theme={ALICORN_DEFAULT_THEME_DARK}>
                    <NextUIProvider>
                        <Router hook={useHashLocation}>
                            <AppLegacy/>
                        </Router>
                    </NextUIProvider>
                    {getString("theme") === "Random" ? (
                        <Typography
                            sx={{
                                pointerEvents: "none",
                                position: "fixed",
                                left: "0.3125rem",
                                bottom: "0.3125rem"
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
                            right: "0.3125rem",
                            bottom: "0.3125rem"
                        }}
                        color={"primary"}
                    >
                        {"Alicorn JE " + pkg.codename + " #" + pkg.updatorVersion}
                    </Typography>
                    <div
                        style={{
                            position: "fixed",
                            left: 0,
                            right: 0,
                            pointerEvents: "none",
                            top: 0,
                            bottom: 0,
                            opacity: getNumber("theme.background.opacity") / 100,
                            backgroundImage: `url(${url || ""})`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            backgroundColor: "transparent",
                            backgroundPosition: "center"
                        }}
                    />
                </ThemeProvider>
            </InstructionProvider>
        </Box>
    );
}
