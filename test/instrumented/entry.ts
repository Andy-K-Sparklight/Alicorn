import { iTest } from "~/test/instrumented/tools";
import assert from "node:assert";
import { app } from "electron";
import { checkFileDownload } from "~/test/instrumented/net";
import { paths } from "@/main/fs/paths";
import path from "path";
import { checkInstallJRT } from "~/test/instrumented/jrt";
import { checkHash } from "~/test/instrumented/hash";

/**
 * The main entry of instrumented test.
 */
export async function runInstrumentedTest() {
    paths.setup({
        storeRoot: path.resolve("emulated", "store")
    });


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
