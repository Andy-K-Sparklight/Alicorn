/**
 * Packages the application for supported platforms.
 */
import { type Options, packager } from "@electron/packager";
import { zip } from "compressing";
import consola from "consola";
import fs from "fs-extra";
import path from "node:path";
import { build } from "~/build-src/run-build";
import pkg from "~/package.json";

const platforms = ["win32", "darwin", "linux"];
const arches = ["x64", "arm64"];

consola.info(`Start cross-packaging for ${platforms.join(",")} x ${arches.join(",")}`);

await fs.ensureDir(path.resolve(import.meta.dirname, "dist"));

for (const platform of platforms) {
    for (const arch of arches) {
        consola.start(`build: ${platform}-${arch}...`);
        await build({ mode: "production", platform, arch });

        consola.start(`hot-update bundle: ${platform}-${arch}...`);
        const src = path.join(import.meta.dirname, "build", "production");
        await zip.compressDir(src, path.resolve(import.meta.dirname, "dist", `app-bundle-${platform}-${arch}.zip`), { ignoreBase: true });

        consola.start(`pack: ${platform}-${arch}...`);
        const opts = {
            asar: false,
            name: "Alicorn Launcher",
            executableName: "Alicorn",
            appBundleId: "moe.skjsjhb.alicorn",
            appCopyright: `Copyright (C) 2021-2022 Andy K Rarity Sparklight ("ThatRarityEG") / Copyright (C) 2024-2025 Ted Gao ("skjsjhb")`,
            appCategoryType: "public.app-category.utilities",
            appVersion: pkg.version,
            icon: path.resolve(import.meta.dirname, "resources", "icons", "icon"),
            dir: path.resolve(import.meta.dirname, "build", "production"),
            arch: arch,
            platform: platform,
            out: path.resolve(import.meta.dirname, "dist"),
            overwrite: true,
            ignore: [".local", "node.napi.node"]
        } satisfies Options;

        await packager(opts);
    }
}

consola.success("done.");
