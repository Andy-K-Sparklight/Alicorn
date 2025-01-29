import consola from "consola";
import fs from "fs-extra";
import { type TestSummary } from "~/test/instrumented/tools";

export async function printTestSummary(f: string): Promise<void> {
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
        consola.success("All tests have passed.");
        process.exit(0);
    } else {
        console.error("There are failed tests and need to be resolved.");
        process.exit(1);
    }
}
