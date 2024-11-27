import { app, BrowserWindow, Menu, screen, Session } from "electron";
import { btoa } from "js-base64";
import os from "os";
import path from "path";
import { DOH_CONFIGURE } from "@/modules/commons/Constants";
import { getBoolean, getNumber, getString, loadConfigSync } from "@/modules/config/ConfigSupport";
import { setBeacon } from "@/modules/selfupdate/Beacon";
import { registerBackgroundListeners } from "./Background";
import pkg from "~/package.json";
import { ping } from "@/main/dev/ping";
import { conf } from "@/main/conf/conf";
import { bwctl } from "@/main/sys/bwctl";
import { paths } from "@/main/fs/paths";

void main();

/**
 * Main window.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Main entry point.
 */
async function main() {
    checkSingleInstance();

    console.log(`Alicorn Launcher "${pkg.family}" ${pkg.version}`);

    const { electron, node, chrome } = process.versions;

    console.log(`Electron ${electron} / Node.js ${node} / Chrome ${chrome}`);

    console.log("Loading config...");
    await conf.load();

    console.log("Setting up application...");
    await app.whenReady();

    console.log("Executing regular initializers...");
    conf.setup();
    ping.setup();

    // TODO remove legacy code after refactor
    console.log("Executing legacy tasks...");
    loadConfigSync();

    if (!getBoolean("hardware-acc") && !getBoolean("features.skin-view-3d")) {
        // If 3D enabled then we should use hardware acc
        try {
            app.disableHardwareAcceleration();
        } catch {}
    }

    addErrorHandlers();

    // Legacy code ends here

    console.log("Creating window...");
    const [width, height] = optimalWindowSize();

    const appPath = app.getAppPath();

    paths.setup();

    mainWindow = new BrowserWindow({
        width, height,
        webPreferences: {
            webSecurity: false, // TODO disable after resolve CORS issues
            nodeIntegration: true, // TODO disable after delegate node calls to background
            nodeIntegrationInWorker: true, // TODO disable after worker refactor
            contextIsolation: false, // TODO
            sandbox: false, // TODO
            spellcheck: false,
            zoomFactor: getNumber("theme.zoom-factor", 1.0),
            defaultEncoding: "UTF-8",
            backgroundThrottling: false,
            preload: paths.app.get("preload.js")
        },
        frame: getString("frame.drag-impl") === "TitleBar",
        show: false,
        backgroundColor: "#fff"
    });

    bwctl.setup();
    bwctl.forWindow(mainWindow, { forwardCloseEvent: true });

    // Exit app once main window closed
    mainWindow.once("closed", () => {
        mainWindow = null;
        void shutdownApp();
    });


    // TODO remove legacy code after refactor
    createMenus(mainWindow);

    mainWindow.webContents.on("did-navigate-in-page", () => {
        mainWindow?.webContents.setZoomLevel(0);
    });
    mainWindow.webContents.on("paint", () => {
        mainWindow?.webContents.setZoomLevel(0);
    });
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow?.webContents.setZoomLevel(0);
    });

    console.log("Registering event listeners...");
    registerBackgroundListeners();

    mainWindow.once("ready-to-show", async () => {
        applyDoHSettings();
        console.log("Setting up proxy!");
        await initProxy(getMainWindow()?.webContents.session);
        mainWindow?.on("resize", () => {
            mainWindow?.webContents.send("mainWindowResized", mainWindow.getSize());
        });
        mainWindow?.on("move", () => {
            mainWindow?.webContents.send("mainWindowMoved", mainWindow.getPosition());
        });
        console.log("Placing beacon!");
        try {
            await setBeacon();
        } catch (e) {
            console.log(e);
        }
        console.log("All caught up! Alicorn is now initialized.");
        if (getBoolean("dev")) {
            console.log("Development mode detected, opening devtools...");
            mainWindow?.webContents.openDevTools();
        }
    });

    console.log("Preparing window!");

    // Load renderer from dev server (dev) or file (prod).
    if (import.meta.env.ALICORN_DEV && process.env.ALICORN_DEV_SERVER) {
        const devServerURL = `http://localhost:${import.meta.env.ALICORN_DEV_SERVER_PORT}/Renderer.html`;
        console.log(`Picked up dev server URL: ${devServerURL}`);
        await mainWindow.loadURL(devServerURL);
    } else {
        await mainWindow.loadFile(path.resolve(appPath, "Renderer.html"));
    }

    mainWindow?.webContents.setZoomLevel(0);
}

/**
 * App shutdown routine.
 */
async function shutdownApp() {
    // TODO remove other daemon processes
    console.log("Stopping!");

    setTimeout(() => {
        console.log("Forcefully stopping due to shutdown timeout.");
        app.exit();
    }, 30_000);

    await conf.store();

    app.exit();
}

/**
 * Create menus.
 *
 * @param w Window to apply menus.
 * @deprecated The menus lack portability and will be replaced after UI re-layout
 */
function createMenus(w: BrowserWindow) {
    if (getString("frame.drag-impl") === "TitleBar") {
        const subMenus = [
            "LaunchPad",
            "Welcome",
            "InstallCore",
            "ContainerManager",
            "JavaSelector",
            "AccountManager",
            "Cadance",
            "Boticorn",
            "UtilitiesIndex",
            "Statistics",
            "Options",
            "ServerList",
            "Version",
            "TheEndingOfTheEnd"
        ].map((lb) => {
            return {
                label: lb,
                click: async () => mainWindow?.webContents.send("menu-click", lb)
            };
        });

        if (os.platform() == "darwin") {
            const menu = Menu.buildFromTemplate([
                { label: "Alicorn", submenu: [{ role: "quit" }, ...subMenus] }
            ]);
            Menu.setApplicationMenu(menu);
        } else {
            const menu = Menu.buildFromTemplate(subMenus);
            w.setMenu(menu);
        }
    } else {
        w.setMenu(null);
    }
}

/**
 * Checks for single instance and exits when not satisfied.
 */
function checkSingleInstance() {
    if (!app.requestSingleInstanceLock()) {
        console.log("I won't create a new instance when another Alicorn is running.");
        app.quit();
    } else {
        const reopenWindow = () => {
            mainWindow?.show();
            mainWindow?.restore();
        };
        app.on("second-instance", reopenWindow);

        // macOS open action handler
        app.on("activate", reopenWindow);
    }
}

/**
 * Gets an optimal window size for the main window.
 *
 * This function sizes the window based on the size of the primary display, with the fixed aspect ratio 16:10 and scale
 * factor 0.6.
 */
function optimalWindowSize(): [number, number] {
    let { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const ratio = width / height;
    const expRatio = 16 / 10;
    if (ratio > expRatio) {
        width = height * expRatio;
    } else {
        height = width / expRatio;
    }

    const scaleFactor = 0.6;

    return [width * scaleFactor, height * scaleFactor];
}


/**
 * Moves to the error page when an error occurred on the main process.
 *
 * @deprecated This negatively affects user experience
 */
function addErrorHandlers() {
    process.on("uncaughtException", async (e) => {
        try {
            console.log(e);
            await mainWindow?.webContents.loadFile("Error.html", {
                hash: btoa(encodeURIComponent(String(e.message)))
            });
        } catch {}
    });

    process.on("unhandledRejection", async (r) => {
        try {
            console.log(String(r));
            await mainWindow?.webContents.loadFile("Error.html", {
                hash: btoa(encodeURI(String(r)))
            });
        } catch {}
    });
}

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export async function initProxy(session?: Session): Promise<void> {
    const proc = getString("download.global-proxy");
    if (proc.trim().length === 0) {
        /* await getMainWindow()?.webContents.session.setProxy({
          mode: "auto_detect",
        }); */
        // Let Electron decide!
        return;
    }
    await session?.setProxy({
        proxyRules: proc,
        proxyBypassRules: getString(
            "download.proxy-bypass",
            "<local>,.cn,.bangbang93.com,.littleservice.cn"
        )
    });
    console.log("Proxy set.");
}

function applyDoHSettings(): void {
    // @ts-ignore
    if (app.configureHostResolver) {
        // Compatibility
        const dh = getString("doh-server", "Native");
        const p = DOH_CONFIGURE[dh] || "";
        const k = Object.values(DOH_CONFIGURE);
        k.splice(k.indexOf(p), 1);
        if (p.length > 0) {
            console.log("Configuring DoH server as " + p);
            app.configureHostResolver({
                secureDnsMode: "secure",
                secureDnsServers: [p, ...k] // Align the rest
            });
        }
    } else {
        console.log(
            "Current Electron binary doesn't support DoH settings, skipped."
        );
    }
}

export function getMainWindowUATrimmed(): string {
    const ua = mainWindow?.webContents.getUserAgent();
    if (ua) {
        const uas = ua.split(" ");
        const o: string[] = [];
        uas.forEach((unit) => {
            if (!unit.includes("Alicorn") && !unit.includes("Electron")) {
                o.push(unit);
            }
        });
        return o.join(" ");
    }
    return "";
}
