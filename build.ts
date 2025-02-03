import consola from "consola";
import os from "node:os";
import { build } from "./build-src/run-build";
import type { BuildMode } from "./config";

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
