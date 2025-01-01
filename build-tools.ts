// Runs the development build and starts frontend hot-reloading server
import esbuild, { type BuildOptions } from "esbuild";
import typiaPlugin from "@ryoppippi/unplugin-typia/esbuild";
import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import fs from "fs-extra";

import path from "path";
import consola from "consola";
import * as vite from "vite";
import * as child_process from "node:child_process";
import { type BuildVariant, createBuildConfig } from "~/config";
import { createBuildDefines } from "~/defines";

export async function build(variant: BuildVariant) {
    const cfg = createBuildConfig(variant);
    const defs = createBuildDefines(cfg);

    consola.info(`This build is configured for ${cfg.variant.platform}-${cfg.variant.arch}`);

    consola.box("Effective config:\n\n" + JSON.stringify(cfg, null, 2));

    const isDev = cfg.variant.mode === "development";

    const outputDir = path.resolve(import.meta.dirname, "build", isDev ? "dev" : "prod");

    await fs.emptyDir(outputDir);

    const defines = {
        "__dirname": "import.meta.dirname",
        "__filename": "import.meta.filename",
        ...defs
    };

    const sharedOptions: BuildOptions = {
        sourcemap: isDev && "linked",
        bundle: true,
        minify: !isDev,
        platform: "node",
        external: ["electron", "original-fs"],
        define: defines,
        outdir: outputDir,
        metafile: true,
        drop: isDev ? [] : ["console"]
    };

    const mainBuildOptions: BuildOptions = {
        entryPoints: {
            main: "src/main/main.ts",
            "hash-worker": "src/main/security/hash-worker.ts"
        },
        plugins: [
            typiaPlugin({ cache: true, log: false }),
            TsconfigPathsPlugin({ tsconfig: "./tsconfig.json" })
        ],
        chunkNames: "[hash]",
        splitting: true,
        format: "esm",
        ...sharedOptions
    };

    const preloadBuildOptions: BuildOptions = {
        entryPoints: {
            preload: "src/preload/preload.ts"
        },
        plugins: [
            TsconfigPathsPlugin({ tsconfig: "./tsconfig.json" })
        ],
        ...sharedOptions
    };


    consola.start(`Creating output directory at ${outputDir}`);
    await fs.ensureDir(outputDir);

    consola.start("Copying resources...");
    await fs.copy("resources", outputDir);

    consola.start("Copying native addons...");

    if (cfg.enableNativeLZMA) {
        const platform = cfg.variant.platform + "-" + cfg.variant.arch;
        try {
            await fs.copy(`node_modules/lzma-native/prebuilds/${platform}`, path.join(outputDir, `natives/lzma-native/prebuilds/${platform}`));
        } catch (e) {
            consola.error("Unable to copy lzma-native prebuilt binaries. (Is it supported?)");
            throw e;
        }
    }

    consola.start("Building main modules...");
    const buildResult = await esbuild.build(mainBuildOptions);
    await fs.outputJSON(path.join(outputDir, ".local/build.meta.json"), buildResult.metafile);
    consola.success("Main modules built.");

    consola.start("Building preload modules...");
    await esbuild.build(preloadBuildOptions);
    consola.success("Preload modules built.");

    const viteConfig = path.resolve(import.meta.dirname, "vite.config.ts");

    if (isDev) {
        consola.start("Starting renderer development server...");

        const server = await vite.createServer({
            configFile: viteConfig,
            server: { port: cfg.devServerPort, strictPort: true },
            define: defines
        });

        await server.listen();

        consola.start("Starting Electron process...");
        const electronExec = path.resolve(import.meta.dirname, "node_modules", "electron", "cli.js");
        const proc = child_process.fork(electronExec, ["."], { cwd: outputDir });

        process.once("SIGINT", () => {
            consola.info("Closing Electron app...");
            proc.kill();
            void server.close();
        });

        proc.once("exit", () => {
            consola.info("Stopping server...");
            void server.close();
        });
    } else {
        consola.start("Running build for renderer module...");
        await vite.build({ configFile: viteConfig, define: defines });
        consola.success("Renderer module build process completed.");
    }

    consola.success("Done.");
}
