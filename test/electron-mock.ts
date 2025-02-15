import { mock } from "bun:test";
import path from "node:path";

class BrowserWindow {
    static getAllWindows() {
        return [];
    }
}

mock.module("electron", () => {
    return {
        app: {
            getAppPath() {
                return path.resolve("build", "dev");
            },

            getPath(sec: string) {
                switch (sec) {
                    case "app":
                        return this.getAppPath();
                    case "temp":
                        return path.resolve("emulated", "temp");
                }
            }
        },
        screen: {},
        ipcMain: {},
        net: { fetch },
        BrowserWindow
    };
});
