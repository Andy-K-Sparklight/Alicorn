import { app } from "electron";
import assert from "node:assert";
import { checkHash } from "~/test/instrumented/hash";
import { checkInstaller } from "~/test/instrumented/install";
import { checkInstallJRT } from "~/test/instrumented/jrt";
import { checkFileDownload } from "~/test/instrumented/net";
import { checkRegistries } from "~/test/instrumented/reg";
import { iTest } from "~/test/instrumented/tools";

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
        checkRegistries()
    ]);

    await iTest.dumpSummary();
    app.quit();
}

async function checkAppReady() {
    await iTest.run("Check App Ready", () => {
        assert(app.isReady());
    });
}
