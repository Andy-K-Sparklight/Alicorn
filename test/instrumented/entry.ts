import { app } from "electron";
import assert from "node:assert";
import { checkCache } from "./cache";
import { checkHash } from "./hash";
import { checkInstaller } from "./install";
import { checkInstallJRT } from "./jrt";
import { checkFileDownload } from "./net";
import { checkRegistries } from "./reg";
import { iTest } from "./tools";

/**
 * The main entry of instrumented test.
 */
export async function runInstrumentedTest() {
    await Promise.all([
        checkAppReady(),
        checkFileDownload(),
        checkInstallJRT(),
        checkHash(),
        checkInstaller(),
        checkRegistries(),
        checkCache()
    ]);

    await iTest.dumpSummary();
    app.quit();
}

async function checkAppReady() {
    await iTest.run("Check App Ready", () => {
        assert(app.isReady());
    });
}
