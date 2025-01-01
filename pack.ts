/**
 * Packages the application for supported platforms.
 */
import { type Options, packager } from "@electron/packager";
import pkg from "~/package.json";
import path from "path";
import consola from "consola";
import { build } from "~/build-tools";

const platforms = ["win32", "darwin", "linux"];
const arches = ["x64", "arm64"];

consola.info(`Start cross-packaging for ${platforms.join(",")} x ${arches.join(",")}`);

for (const platform of platforms) {
    for (const arch of arches) {
        consola.start(`Creating app resources for ${platform}-${arch}...`);
        await build({ mode: "production", platform, arch });
        consola.success("App resources built.");

        consola.start(`Packaging for ${platform}-${arch}...`);
        const opts = {
            asar: false,
            name: "Alicorn Launcher",
            appBundleId: "moe.skjsjhb.alicorn",
            appCopyright: `Copyright (C) 2021-2022 Andy K Rarity Sparklight ("ThatRarityEG") / Copyright (C) 2024-2025 Ted Gao ("skjsjhb")`,
            appCategoryType: "public.app-category.utilities",
            appVersion: pkg.version,
            icon: path.resolve(import.meta.dirname, "resources", "icons", "icon"),
            dir: path.resolve(import.meta.dirname, "dist", "prod"),
            arch: arch,
            platform: platform,
            out: path.resolve(import.meta.dirname, "out"),
            overwrite: true,
            ignore: [".local", "node.napi.node"]
        } satisfies Options;

        await packager(opts);
        consola.success(`Packaged for ${platform}-${arch}`);
    }
}

consola.success("All done.");
