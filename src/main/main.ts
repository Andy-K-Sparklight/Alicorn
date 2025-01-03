import { app, BrowserWindow, session } from "electron";
import pkg from "~/package.json";
import { ping } from "@/main/dev/ping";
import { conf } from "@/main/conf/conf";
import { bwctl } from "@/main/sys/bwctl";
import { paths } from "@/main/fs/paths";
import { mirror } from "@/main/net/mirrors";
import { registry } from "@/main/registry/registry";

import os from "node:os";
import { getOSName } from "@/main/sys/os";
import { ext } from "@/main/sys/ext";
import { unwrapESM } from "@/main/util/module";
import { runInstrumentedTest } from "~/test/instrumented/entry";
import { aria2 } from "@/main/net/aria2";


void main();

/**
 * Main window.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Main entry point.
 */
async function main() {
    process.noAsar = true;
    process.env.WS_NO_BUFFER_UTIL = "true";
    process.env.WS_NO_UTF_8_VALIDATE = "true";

    if (!checkSingleInstance()) return;

    console.log(`Alicorn Launcher "${pkg.codename}" ${pkg.version}`);

    const { electron, node, chrome } = process.versions;
    console.log(`Electron ${electron} / Node.js ${node} / Chrome ${chrome}`);

    console.log("Loading config...");
    await conf.load();

    console.log("Setting up application...");
    await app.whenReady();

    // Create an empty handler to prevent auto-closing when all windows are closed
    app.on("window-all-closed", () => {});

    console.log("Initializing modules...");
    conf.setup();

    paths.setup();
    ping.setup();
    ext.setup();

    if (import.meta.env.AL_DEV) {
        console.log("Installing React DevTools for development...");
        const { installExtension, REACT_DEVELOPER_TOOLS } = await unwrapESM(import("electron-devtools-installer"));
        await installExtension(REACT_DEVELOPER_TOOLS);

        // https://github.com/MarshallOfSound/electron-devtools-installer/issues/244
        // A reload is needed for the extensions to work
        console.log("Reloading extensions...");
        session.defaultSession.getAllExtensions().forEach(ex => session.defaultSession.loadExtension(ex.path));
    }

    console.log("Creating window...");
    const [width, height] = bwctl.optimalSize(); // Initial size, will be changed by user settings later
    mainWindow = new BrowserWindow({
        width, height,
        webPreferences: {
            spellcheck: false,
            defaultEncoding: "UTF-8",
            preload: paths.app.to("preload.js"),
            devTools: import.meta.env.AL_DEV
        },
        frame: false,
        show: false,
        icon: getIconPath()
    });

    bwctl.setup();
    bwctl.forWindow(mainWindow, { isMain: true });

    // Exit app once main window closed
    mainWindow.once("closed", () => {
        mainWindow = null;
        void shutdownApp();
    });

    console.log("Loading window contents...");

    // Load renderer from dev server (dev) or file (prod).
    if (import.meta.env.AL_DEV) {
        const devServerURL = `http://localhost:${import.meta.env.AL_DEV_SERVER_PORT}/`;
        console.log(`Picked up dev server URL: ${devServerURL}`);
        await mainWindow.loadURL(devServerURL);

        injectDevToolsStyles(mainWindow);
        mainWindow.webContents.openDevTools();
    } else {
        await mainWindow.loadFile(paths.app.to("renderer", "index.html"));
    }

    console.log("Executing late init tasks...");

    if (conf().net.downloader === "aria2") {
        await aria2.init();
    }

    await mirror.bench();

    if (import.meta.env.AL_TEST) {
        void runInstrumentedTest();
    }
}

/**
 * Fix Electron DevTools styles on Windows.
 */
function injectDevToolsStyles(w: BrowserWindow) {
    if (os.platform() !== "win32") return;

    w.webContents.on("devtools-opened", () => {
        const css = `
            :root {
                --source-code-font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace !important;
                --source-code-font-size: 14px !important;
                --monospace-font-family: var(--source-code-font-family) !important;
                --monospace-font-size: var(--source-code-font-size) !important;
                --default-font-size: var(--source-code-font-size) !important;
            }
        `;
        w.webContents.devToolsWebContents?.executeJavaScript(`
            const overriddenStyle = document.createElement('style');
            overriddenStyle.innerHTML = '${css.replaceAll("\n", " ").replaceAll("'", "\\'")}';
            document.body.append(overriddenStyle);
            document.querySelectorAll('.platform-windows').forEach(el => el.classList.remove('platform-windows'));
        `);
    });
}

/**
 * App shutdown routine.
 */
async function shutdownApp() {
    console.log("Stopping!");

    setTimeout(() => {
        console.log("Forcefully stopping due to shutdown timeout.");
        app.exit();
    }, 30_000);

    await conf.store();
    await registry.saveAll();
    aria2.shutdown();

    console.log("Exiting.");
    app.quit();
}

/**
 * Checks for single instance and exits when not satisfied.
 */
function checkSingleInstance() {
    if (!app.requestSingleInstanceLock()) {
        console.log("I won't create a new instance when another Alicorn is running.");
        app.quit();
        return false;
    } else {
        const reopenWindow = () => {
            mainWindow?.show();
            mainWindow?.restore();
        };
        app.on("second-instance", reopenWindow);

        // macOS open action handler
        app.on("activate", reopenWindow);
        return true;
    }
}

/**
 * Gets the path to the icon.
 *
 * This method has no effect on macOS.
 */
function getIconPath(): string {
    let rel = "icon.png";
    if (getOSName() === "windows") {
        rel = "icon.ico";
    }
    return paths.app.to("icons", rel);
}
