import { iTest } from "~/test/instrumented/tools";
import assert from "node:assert";
import { app } from "electron";
import { checkFileDownload } from "~/test/instrumented/net";
import { checkInstallJRT } from "~/test/instrumented/jrt";
import { checkHash } from "~/test/instrumented/hash";

/**
 * The main entry of instrumented test.
 */
export async function runInstrumentedTest() {
    await Promise.all([
        checkAppReady(),
        checkFileDownload(),
        checkInstallJRT(),
        checkHash()
    ]);

    await iTest.dumpSummary();
    app.quit();
}

async function checkAppReady() {
    await iTest.run("Check App Ready", () => {
        assert(app.isReady());
    });
}
