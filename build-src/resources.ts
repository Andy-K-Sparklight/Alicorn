import path from "node:path";
import consola from "consola";
import fs from "fs-extra";
import type { BuildConfig } from "~/config";
import { linkAll } from "./util";
import { vendor } from "./vendor";

export async function processResources(cfg: BuildConfig): Promise<void> {
    const { outputDir } = cfg;

    consola.start("res: linking app resources");
    await linkAll("resources", outputDir);
    await emitPackageJson(outputDir);

    consola.start("res: processing vendored files");
    await vendor.prepareAssets(cfg, path.join(outputDir, "vendor"));
}

async function emitPackageJson(outDir: string) {
    const src = await fs.readJSON(path.resolve(import.meta.dirname, "..", "package.json"));

    const output = {
        name: src.name,
        author: src.author,
        main: "boot.js",
        type: "module",
        version: src.version,
    };

    await fs.outputJSON(path.join(outDir, "package.json"), output);
}
