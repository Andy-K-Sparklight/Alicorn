import { conf } from "@/main/conf/conf";
import { confHost } from "@/main/conf/conf-host";
import { paths } from "@/main/fs/paths";
import { vanillaInstaller } from "@/main/install/vanilla";
import { aria2 } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { nfat } from "@/main/net/nfat";
import { registry } from "@/main/registry/registry";
import { bwctl } from "@/main/sys/bwctl";
import { ext } from "@/main/sys/ext";
import { getOSName } from "@/main/sys/os";
import { app, BrowserWindow, Menu } from "electron";
import events from "node:events";
import os from "node:os";
import path from "path";
import pkg from "~/package.json";
import { runInstrumentedTest } from "~/test/instrumented/entry";
import "v8-compile-cache";

void main();

/**
 * Main window.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Main entry point.
 */
async function main() {
    Menu.setApplicationMenu(null);

    process.noAsar = true;
    events.defaultMaxListeners = 8192;

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

    const hasDevTools = import.meta.env.AL_DEV || conf().dev.devTools;

    if (import.meta.env.AL_TEST) {
        paths.setup({
            storeRoot: path.resolve("emulated", "store")
        });
    } else {
        paths.setup();
    }

    await registry.init();

    confHost.setup();
    ext.setup();

    // React DevTools seems unable to load starting from Electron v33
    // This can only be enabled when https://github.com/electron/electron/issues/41613 is solved
    // Reinstall electron-devtools-installer and uncomment things below if then

    // if (import.meta.env.AL_DEV) {
    //     console.log("Installing React DevTools for development...");
    //     const { installExtension, REACT_DEVELOPER_TOOLS } = await unwrapESM(import("electron-devtools-installer"));
    //     await installExtension(REACT_DEVELOPER_TOOLS);
    //
    //     // https://github.com/MarshallOfSound/electron-devtools-installer/issues/244
    //     // A reload is needed for the extensions to work
    //     console.log("Reloading extensions...");
    //
    //     for (const ex of session.defaultSession.getAllExtensions()) {
    //         await session.defaultSession.loadExtension(ex.path);
    //     }
    // }

    console.log("Creating window...");

    const { size: [width, height], pos: [px, py] } = conf().app.window;

    const [defWidth, defHeight] = bwctl.optimalSize(); // Initial size, will be changed by user settings later
    const hasFrame = conf().dev.showFrame;

    mainWindow = new BrowserWindow({
        width: Math.floor(width || defWidth),
        height: Math.floor(height || defHeight),
        webPreferences: {
            spellcheck: false,
            defaultEncoding: "UTF-8",
            preload: paths.app.to("preload.js"),
            devTools: hasDevTools
        },
        x: isNaN(px) ? undefined : Math.floor(px),
        y: isNaN(py) ? undefined : Math.floor(py),
        frame: hasFrame,
        show: false,
        icon: getIconPath()
    });

    mainWindow.on("resized", () => conf().app.window.size = mainWindow!.getSize());
    mainWindow.on("moved", () => conf().app.window.pos = mainWindow!.getPosition());

    mainWindow.setMenu(null);

    bwctl.setup();
    bwctl.forWindow(mainWindow);

    // Exit app once main window closed
    mainWindow.once("closed", () => {
        mainWindow = null;
        void shutdownApp();
    });

    console.log("Loading window contents...");

    // Open DevTools if applicable
    if (hasDevTools) {
        injectDevToolsStyles(mainWindow);

        // DevTools can be occasionally blocked by waiting the page to load
        // Open it earlier seems to solve this
        mainWindow.webContents.openDevTools();
    }

    // Load renderer from dev server (dev) or file (prod).
    if (import.meta.env.AL_DEV) {
        const devServerURL = `http://localhost:${import.meta.env.AL_DEV_SERVER_PORT}/`;
        console.log(`Picked up dev server URL: ${devServerURL}`);
        await mainWindow.loadURL(devServerURL);
    } else {
        await mainWindow.loadFile(paths.app.to("renderer", "index.html"));
    }

    console.log("Executing late init tasks...");

    const tasks = [
        conf().net.nfat.enable && nfat.init(),
        conf().net.downloader === "aria2" && aria2.init(),
        mirror.bench(),
        vanillaInstaller.prefetch()
    ].filter(Boolean);

    await Promise.all(tasks);

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
            const s = document.createElement('style');
            s.innerHTML = '${css.replaceAll("\n", " ").replaceAll("'", "\\'")}';
            document.body.append(s);
            document.querySelectorAll('.platform-windows').forEach(e => e.classList.remove('platform-windows'));
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
    registry.close();
    nfat.close();
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
