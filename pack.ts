/**
 * Packages the application for supported platforms.
 */
import { type Options, packager } from "@electron/packager";
import { tgz, zip } from "compressing";
import consola from "consola";
import { createDMG } from "electron-installer-dmg";
import { MSICreator } from "electron-wix-msi";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import * as process from "node:process";
import { build } from "~/build-src/run-build";
import pkg from "~/package.json";

const platformSpec = process.env.ALICORN_PACK_PLATFORMS || "win32,darwin,linux";
const archesSpec = process.env.ALICORN_PACK_ARCHES || "x64,arm64";

const platforms = ["win32", "darwin", "linux"].filter(p => platformSpec.includes(p));
const arches = ["x64", "arm64"].filter(a => archesSpec.includes(a));

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
            consola.success(`Archive written to ${outPath + ".zip"}`);

            if (os.platform() === "win32") {
                await buildWindowsInstaller(outPath, arch);
            } else {
                consola.log("MSI images can only be created on Windows, skipped.");
            }
        }

        if (platform === "darwin") {
            if (os.platform() === "darwin") {
                await buildDMG(outPath);
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

async function buildWindowsInstaller(outPath: string, arch: string) {
    consola.start(`Creating MSI installers from ${outPath}`);

    const root = path.dirname(outPath);

    const msiCreator = new MSICreator({
        appDirectory: outPath,
        description: pkg.description,
        exe: "Alicorn.exe",
        name: "Alicorn Launcher",
        shortName: "Alicorn",
        manufacturer: "Alicorn Launcher",
        version: pkg.version,
        // @ts-expect-error The type is not updated
        arch: arch,
        features: {
            autoLaunch: false,
            autoUpdate: false
        },
        ui: {
            chooseDirectory: true
        },
        icon: path.resolve(import.meta.dirname, "resources/icons/icon.ico"),
        outputDirectory: root
    });
    await msiCreator.create();
    await msiCreator.compile();

    const msiFile = path.join(root, "Alicorn.msi");
    const outFile = path.join(root, `Alicorn.${arch}.msi`);
    await fs.rename(msiFile, outFile);

    consola.success(`MSI installer written to ${outFile}`);
}

async function buildDMG(outPath: string) {
    consola.start(`Creating DMG image from ${outPath}`);

    await createDMG({
        appPath: path.join(outPath, "Alicorn Launcher.app"),
        name: "Alicorn Launcher",
        out: outPath + ".dmg"
    });

    consola.success(`DMG image written to ${outPath + ".dmg"}`);
}
