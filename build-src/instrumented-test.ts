import consola from "consola";
import fs from "fs-extra";
import child_process from "node:child_process";
import path from "node:path";
import { pEvent } from "p-event";
import { type TestSummary } from "~/test/instrumented/tools";

export async function startInstrumentedTest() {
    consola.start("start: instrumented tests");

    const xvfbExec = path.resolve(import.meta.dirname, "..", "node_modules", "xvfb-maybe", "src", "xvfb-maybe.js");
    const electronExec = path.resolve(import.meta.dirname, "..", "node_modules", "electron", "cli.js");
    const cwd = path.resolve(import.meta.dirname, "..", "build", "test");
    const proc = child_process.fork(xvfbExec, [electronExec, "--trace-warnings", "."], { cwd });

    await pEvent(proc, "exit");
    const f = path.join(cwd, "test-summary.json");
    await printTestSummary(f);
}

async function printTestSummary(f: string): Promise<void> {
    const d = await fs.readJSON(f) as TestSummary;

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
