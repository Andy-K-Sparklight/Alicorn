import consola from "consola";
import os from "node:os";
import { build } from "./build-src/run-build";
import type { BuildMode, TestLevel } from "./config";

const mode = process.argv[2] || "development";
if (!["development", "production", "test"].includes(mode)) {
    consola.error(`Unknown build mode: ${mode}`);
    process.exit(1);
}

let testLevel = process.argv[3] || "lite";

if (!["lite", "medium", "full"].includes(testLevel)) {
    consola.error(`Unknown test level: ${testLevel}`);
    process.exit(1);
}

await build({
    mode: mode as BuildMode,
    platform: os.platform(),
    arch: os.arch(),
    testLevel: testLevel as TestLevel
});
