import { writeJSON } from "fs-extra";
import type { TestLevel } from "~/config";

export interface TestSummary {
    allPassed: boolean;
    suites: TestSuiteSummary[];
}

export interface TestSuiteSummary {
    name: string;
    passed: boolean;
    message?: string;
}

const suites: TestSuiteSummary[] = [];

const testLevels = ["lite", "medium", "full"];

async function run(name: string, exec: () => void | Promise<void>, level: TestLevel = "full") {
    if (testLevels.indexOf(import.meta.env.AL_TEST_LEVEL) >= testLevels.indexOf(level)) {
        console.log(`Executing test: ${name}`);
        try {
            await exec();
            suites.push({
                name,
                passed: true
            });
        } catch (e) {
            suites.push({
                name,
                passed: false,
                message: e?.toString()
            });
        }
    } else {
        console.log(`Skipped test: ${name}`);
    }
}


async function dumpSummary() {
    await writeJSON("test-summary.json", {
        allPassed: suites.every(s => s.passed),
        suites
    });
}

export const iTest = { run, dumpSummary };
