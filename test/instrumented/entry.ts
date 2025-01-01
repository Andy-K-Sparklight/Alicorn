import { iTest } from "~/test/instrumented/tools";
import assert from "node:assert";
import { app } from "electron";
import { checkFileDownload } from "~/test/instrumented/net";

/**
 * The main entry of instrumented test.
 */
export async function runInstrumentedTest() {
    await Promise.all([
        checkAppReady(),
        checkFileDownload()
    ]);

    await iTest.dumpSummary();
    app.quit();
}

async function checkAppReady() {
    await iTest.run("Check App Ready", () => {
        assert(app.isReady());
    });
}
