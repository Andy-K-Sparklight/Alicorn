import { build } from "~/build-tools";
import os from "node:os";

const isDev = !process.argv[2]?.toLowerCase().includes("prod");

void build({
    mode: isDev ? "development" : "production",
    platform: os.platform(),
    arch: os.arch()
});