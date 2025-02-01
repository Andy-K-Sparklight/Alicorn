import { conf } from "@/main/conf/conf";
import { paths } from "@/main/fs/paths";
import { vanillaInstaller } from "@/main/install/vanilla";
import { aria2 } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { registry } from "@/main/registry/registry";
import { getOSName } from "@/main/sys/os";
import { windowControl } from "@/main/sys/window-control";
import { app, BrowserWindow, Menu, net, protocol } from "electron";
import events from "node:events";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dedent } from "ts-dedent";
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

    const hasDevTools = import.meta.env.AL_DEV || conf().dev.devTools;

    if (import.meta.env.AL_TEST) {
        paths.setup({
            storeRoot: path.resolve("emulated", "store")
        });
    } else {
        paths.setup();
    }

    addAppProtocolHandler();

    await registry.init();

    // Register IPC handlers
    await import("@/main/api/loader");

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

    const [defWidth, defHeight] = windowControl.optimalSize();
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

    // Open DevTools if applicable
    if (hasDevTools) {
        injectDevToolsStyles(mainWindow);
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("resized", () => conf().app.window.size = mainWindow!.getSize());
    mainWindow.on("moved", () => conf().app.window.pos = mainWindow!.getPosition());

    mainWindow.setMenu(null);

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
    } else {
        await mainWindow.loadURL("app://./index.html");
    }

    console.log("Executing late init tasks...");

    const tasks = [
        conf().net.downloader === "aria2" && aria2.init(),
        mirror.bench(),
        vanillaInstaller.prefetch()
    ].filter(Boolean);

    await Promise.all(tasks);

    const deltaTime = Math.round(performance.now() - beginTime) / 1000;

    console.log(`Done (${deltaTime}s)! Alicorn is now fully initialized.`);

    if (import.meta.env.AL_TEST) {
        void runInstrumentedTest();
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
        const css = dedent`
            :root {
                --source-code-font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace !important;
                --source-code-font-size: 14px !important;
                --monospace-font-family: var(--source-code-font-family) !important;
                --monospace-font-size: var(--source-code-font-size) !important;
                --default-font-size: var(--source-code-font-size) !important;
            }
        `;
        w.webContents.devToolsWebContents?.executeJavaScript(dedent`
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
    await registry.close();
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
