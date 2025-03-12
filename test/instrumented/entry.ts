import { app } from "electron";
import { iTest } from "~/test/instrumented/tools";

/**
 * The main entry of instrumented test.
 */
export async function runInstrumentedTest() {
    await Promise.all([
        import("./cache"),
        import("./hash"),
        import("./install"),
        import("./jrt"),
        import("./net"),
        import("./reg")
    ]);

    await iTest.dumpSummary();
    app.quit();
}
