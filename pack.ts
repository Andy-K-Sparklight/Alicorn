/**
 * Packages the application for supported platforms.
 */
import { type Options, packager } from "@electron/packager";
import { tgz, zip } from "compressing";
import consola from "consola";
import { createDMG } from "electron-installer-dmg";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { build } from "~/build-src/run-build";
import pkg from "~/package.json";

const platforms = ["win32", "darwin", "linux"];
const arches = ["x64", "arm64"];

consola.info(`Start cross-packaging for ${platforms.join(",")} x ${arches.join(",")}`);

const outRoot = path.resolve(import.meta.dirname, "dist");
await fs.emptyDir(outRoot);

for (const platform of platforms) {
    for (const arch of arches) {
        consola.start(`build: ${platform}-${arch}...`);
        await build({ mode: "production", platform, arch });

        consola.start(`hot-update bundle: ${platform}-${arch}...`);
        const appRoot = path.join(import.meta.dirname, "build", "production");
        await zip.compressDir(appRoot, path.resolve(outRoot, `app-bundle-${platform}-${arch}.zip`), { ignoreBase: true });

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
            dir: appRoot,
            arch: arch,
            platform: platform,
            out: outRoot,
            overwrite: true,
            ignore: [".local", "node.napi.node"]
        } satisfies Options;

        const [outPath] = await packager(opts);

        if (platform === "win32") {
            consola.start(`Creating zip archive from ${outPath}`);
            await zip.compressDir(outPath, outPath + ".zip", { ignoreBase: true });
        }

        if (platform === "darwin") {
            if (os.platform() === "darwin") {
                consola.start(`Creating DMG image from ${outPath}`);
                await createDMG({
                    appPath: path.join(outPath, "Alicorn Launcher.app"),
                    name: "Alicorn Launcher",
                    out: outPath + ".dmg"
                });
            } else {
                consola.log("DMG images can only be created on macOS, skipped.");
            }
        }

        if (platform === "linux") {
            consola.start(`Creating tar.gz package from ${outPath}`);
            await tgz.compressDir(outPath, outPath + ".tar.gz", { ignoreBase: true });
        }
    }
}

consola.success("done.");
