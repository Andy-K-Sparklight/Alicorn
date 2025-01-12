import consola from "consola";
import child_process from "node:child_process";
import os from "node:os";
import path from "path";
import { build } from "~/build-tools";
import type { BuildMode } from "~/config";
import { printTestSummary } from "~/scripts/instrumented-test";

const mode = process.argv[2] || "development";
if (!["development", "production", "test"].includes(mode)) {
    consola.error(`Unknown build mode: ${mode}`);
    process.exit(1);
}

await build({
    mode: mode as BuildMode,
    platform: os.platform(),
    arch: os.arch()
});

if (mode === "test") {
    consola.start("Running instrumented tests...");

    const xvfbExec = path.resolve(import.meta.dirname, "node_modules", "xvfb-maybe", "src", "xvfb-maybe.js");
    const electronExec = path.resolve(import.meta.dirname, "node_modules", "electron", "cli.js");
    const cwd = path.resolve(import.meta.dirname, "build", "prod");
    const proc = child_process.fork(xvfbExec, [electronExec, "."], { cwd });

    proc.once("exit", () => {
        const f = path.join(cwd, "test-summary.json");
        void printTestSummary(f);
    });
}