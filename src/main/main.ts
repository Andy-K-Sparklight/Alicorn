import { conf } from "@/main/conf/conf";
import { paths } from "@/main/fs/paths";
import { forgeInstaller } from "@/main/install/forge";
import { neoforgedInstaller } from "@/main/install/neoforged";
import { vanillaInstaller } from "@/main/install/vanilla";
import { venv } from "@/main/launch/venv";
import { aria2 } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { registry } from "@/main/registry/registry";
import { cleaner } from "@/main/sys/cleaner";
import { getOSName } from "@/main/sys/os";
import { update } from "@/main/sys/update";
import { windowControl } from "@/main/sys/window-control";
import { app, BrowserWindow, Menu, net, protocol, session } from "electron";
import { installExtension, REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";
import { randomUUID } from "node:crypto";
import events from "node:events";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pkg from "~/package.json";
import { runInstrumentedTest } from "~/test/instrumented/entry";
import "v8-compile-cache";

void main();

/**
 * Main entry point.
 */
async function main() {
    const beginTime = performance.now();
    Menu.setApplicationMenu(null);

    process.noAsar = true;
    events.defaultMaxListeners = 8192;

    registerAppProtocol();

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


    if (import.meta.env.AL_TEST) {
        paths.setup({
            storeRoot: path.resolve("emulated", "store"),
            gameRoot: path.resolve("emulated", "store", "game")
        });
    } else {
        paths.setup();
    }

    addAppProtocolHandler();

    await registry.init();

    // Register IPC handlers
    await import("@/main/api/loader");

    if (import.meta.env.AL_DEV) {
        try {
            console.log("Installing React DevTools for development...");

            await installExtension(REACT_DEVELOPER_TOOLS);
            await launchExtServiceWorker();
        } catch (e) {
            console.error("Could not install React DevTools");
            console.error(e);
        }
    }

    if (!import.meta.env.AL_TEST) {
        await setupMainWindow();
    }

    console.log("Executing late init tasks...");

    setAutoSave();

    if (conf().net.allowAria2) {
        await aria2.init();
    }

    // Generate a random client ID if it's not configured
    if (!conf().client.id) {
        conf.alter(c => c.client.id = randomUUID().replaceAll("-", ""));
    }

    const deltaTime = Math.round(performance.now() - beginTime) / 1000;

    console.log(`Done (${deltaTime}s)! Alicorn is now fully initialized.`);

    if (import.meta.env.AL_TEST) {
        void runInstrumentedTest();
    }

    console.log("Running optional tasks...");

    const tasks = [
        venv.recover(),
        cleaner.removeUnusedOAuthPartitions(),
        mirror.bench(),
        vanillaInstaller.prefetch(),
        forgeInstaller.prefetch(),
        neoforgedInstaller.prefetch()
    ].filter(Boolean);

    await Promise.all(tasks);

    // Delay update check after app initialization
    if (conf().app.hotUpdate) {
        await update.runUpdate();
    }

    console.log("All jobs have been done.");
}

async function setupMainWindow() {
    console.log("Creating window...");
    const hasDevTools = import.meta.env.AL_DEV || conf().dev.devTools;

    const { size: [width, height], pos: [px, py] } = conf().app.window;

    const [defWidth, defHeight] = windowControl.optimalSize();
    const hasFrame = conf().dev.showFrame;

    const w = new BrowserWindow({
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
        icon: getIconPath(),
        title: "Alicorn Launcher"
    });

    windowControl.setMainWindow(w);

    // Open DevTools if applicable
    if (hasDevTools) {
        injectDevToolsStyles(w);
        w.webContents.openDevTools();
    }

    w.on("resized", () => {
        conf.alter(c => c.app.window.size = w!.getSize());
    });

    w.on("moved", () => {
        conf.alter(c => c.app.window.pos = w!.getPosition());
    });

    w.on("ready-to-show", () => {
        w.webContents.setZoomFactor(conf().app.window.zoom / 100);
    });

    w.webContents.on("devtools-opened", () => {
        w.webContents.send("devToolsOpened");
    });

    w.setMenu(null);

    // Exit app once main window closed
    w.once("closed", () => {
        windowControl.setMainWindow(null);
        void shutdownApp();
    });

    console.log("Loading window contents...");

    // Load renderer from dev server (dev) or file (prod).
    if (import.meta.env.AL_DEV) {
        const devServerURL = `http://localhost:${import.meta.env.AL_DEV_SERVER_PORT}/`;
        console.log(`Picked up dev server URL: ${devServerURL}`);
        await w.loadURL(devServerURL);
    } else {
        await w.loadURL("app://./index.html");
    }
}

function registerAppProtocol() {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: "app",
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                stream: true,
                codeCache: true
            }
        }
    ]);
}

function addAppProtocolHandler() {
    protocol.handle("app", (req) => {
        const { host, pathname } = new URL(req.url);
        if (host === ".") {
            // Resolve inside the app bundle
            const target = paths.app.to("renderer", pathname.slice(1));
            const root = paths.app.to("renderer");
            const relativePath = path.relative(root, target);
            const safe = relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
            if (safe) {
                return net.fetch(pathToFileURL(target).toString());
            } else {
                return new Response(`The specified path ${target} is not included in the app bundle.`, {
                    status: 404,
                    headers: { "Content-Type": "text/plain" }
                });
            }
        }

        return new Response(`Unable to process request URL: ${req.url}`, {
            status: 404,
            headers: { "Content-Type": "text/plain" }
        });
    });
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

let currentSaving: Promise<void> | null = null;

async function saveContents() {
    if (!currentSaving) {
        // Add this flag to prevent writing concurrently to the same file
        currentSaving = (async () => {
            await conf.store();
            await registry.close();
            currentSaving = null;
        })();
    }

    await currentSaving;
}

let autoSaveInterval: NodeJS.Timer;

function setAutoSave() {
    autoSaveInterval = setInterval(() => {
        console.log("Auto saving in progress.");
        void saveContents();
    }, 5 * 60 * 1000);
}

/**
 * App shutdown routine.
 */
async function shutdownApp() {
    console.log("Stopping!");

    setTimeout(() => {
        console.log("Forcefully stopping due to shutdown timeout.");
        app.exit();
    }, 30 * 1000);

    clearInterval(autoSaveInterval);
    await saveContents();

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
            const w = windowControl.getMainWindow();
            w?.show();
            w?.restore();
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

/**
 * A workaround to load React DevTools.
 * https://github.com/electron/electron/issues/41613
 */
function launchExtServiceWorker() {
    return Promise.all(
        session.defaultSession.getAllExtensions().map(async ext => {
            const manifest = ext.manifest;
            if (manifest?.manifest_version === 3 && manifest?.background?.service_worker) {
                await session.defaultSession.serviceWorkers.startWorkerForScope(ext.url);
            }
        })
    );
}
