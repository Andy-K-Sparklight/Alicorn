import child_process from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import consola from "consola";
import fs from "fs-extra";
import { pEvent } from "p-event";
import type { TestSummary } from "~/test/instrumented/tools";

export async function startInstrumentedTest(appDir: string) {
    consola.start("start: instrumented tests");

    const require = createRequire(import.meta.url);
    const xvfbExec = require.resolve("xvfb-maybe/src/xvfb-maybe.js");
    const electronExec = require.resolve("electron/cli.js");
    const proc = child_process.fork(xvfbExec, [electronExec, "--trace-warnings", "."], {
        cwd: appDir,
    });

    await pEvent(proc, "exit");
    const f = path.join(appDir, "test-summary.json");
    await printTestSummary(f);
}

async function printTestSummary(f: string): Promise<void> {
    const d = (await fs.readJSON(f)) as TestSummary;

    for (const s of d.suites) {
        if (s.passed) {
            consola.success(`${s.name} - PASSED`);
        } else {
            consola.error(`${s.name} - FAILED`);
            consola.error(s.message);
        }
    }

    if (d.allPassed) {
        consola.success("done: all tests have passed.");
        process.exit(0);
    } else {
        consola.error("failed: there are failed tasks, check the output above.");
        process.exit(1);
    }
}
