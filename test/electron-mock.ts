import path from "node:path";
import type { TestContext } from "node:test";

export function mockElectron(t: TestContext) {
    t.mock.module("electron", {
        exports: {
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
                },
            },
            screen: {},
            ipcMain: {},
            net: { fetch },
            BrowserWindow,
        },
    });
}

// biome-ignore lint/complexity/noStaticOnlyClass: Test compatibility.
class BrowserWindow {
    static getAllWindows() {
        return [];
    }
}
