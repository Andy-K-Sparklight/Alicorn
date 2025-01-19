import { mock } from "bun:test";
import path from "node:path";

class BrowserWindow {}

mock.module("electron", () => {
    return {
        app: { getAppPath: () => path.resolve("build", "dev") },
        screen: {},
        ipcMain: {},
        net: { fetch },
        BrowserWindow
    };
});
