import { writeJSON } from "fs-extra";

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

async function run(name: string, exec: () => void | Promise<void>) {
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
}


async function dumpSummary() {
    await writeJSON("test-summary.json", {
        allPassed: suites.every(s => s.passed),
        suites
    });
}

export const iTest = { run, dumpSummary };