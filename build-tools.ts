// Runs the development build and starts frontend hot-reloading server
import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import consola from "consola";
import esbuild, { type BuildOptions } from "esbuild";
import fs from "fs-extra";
import * as child_process from "node:child_process";

import path from "node:path";
import { dedent } from "ts-dedent";
import * as vite from "vite";
import { type BuildVariant, createBuildConfig } from "~/config";
import { createBuildDefines } from "~/scripts/defines";
import { vendor } from "~/scripts/vendor";

export async function build(variant: BuildVariant) {
    const cfg = createBuildConfig(variant);
    const defs = createBuildDefines(cfg);

    consola.info(`This build is configured for ${cfg.variant.platform}-${cfg.variant.arch}`);

    consola.box("Effective config:\n\n" + JSON.stringify(cfg, null, 2));

    const isDev = cfg.variant.mode === "development";

    const outputDir = path.resolve(import.meta.dirname, "build", isDev ? "dev" : "prod");

    await fs.emptyDir(outputDir);

    const defines = {
        "process.env.NODE_ENV": isDev ? "\"development\"" : "\"production\"",
        "__dirname": "import.meta.dirname",
        "__filename": "import.meta.filename",

        // Exclude polyfills from the ws library
        "process.env.WS_NO_BUFFER_UTIL": "\"true\"",
        "process.env.WS_NO_UTF_8_VALIDATE": "\"true\"",
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
        // drop: cfg.variant.mode === "production" ? ["console"] : undefined,
        alias: {
            "readable-stream": "node:stream"
        },
        legalComments: "none"
    };

    const mainBuildOptions: BuildOptions = {
        entryPoints: {
            main: "src/main/main.ts",
            "hash-worker": "src/main/security/hash-worker.ts"
        },
        plugins: [
            TsconfigPathsPlugin({ tsconfig: "./tsconfig.json" })
        ],
        chunkNames: "[hash]",
        splitting: true,
        format: "esm",
        banner: {
            // A patch to make require available
            js: dedent`
                import { createRequire } from "node:module";
                global.require = createRequire(import.meta.url);
            `
        },
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

    consola.start("Linking resources...");
    await linkAll("resources", outputDir);

    consola.start("Preparing vendor resources...");
    await vendor.prepareAssets(cfg, path.join(outputDir, "vendor"));

    consola.start("Linking native addons...");
    const platform = cfg.variant.platform + "-" + cfg.variant.arch;

    await fs.link("node_modules/node-sqlite3-wasm/dist/node-sqlite3-wasm.wasm", path.join(outputDir, "node-sqlite3-wasm.wasm"));

    if (cfg.enableNativeLZMA) {
        try {
            await linkAll(`node_modules/lzma-native/prebuilds/${platform}`, path.join(outputDir, `natives/lzma-native/prebuilds/${platform}`));
        } catch (e) {
            consola.error("Unable to link lzma-native prebuilt binaries. (Is it supported?)");
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
        const proc = child_process.fork(electronExec, ["--trace-warnings", "."], { cwd: outputDir });

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

async function linkAll(src: string, dst: string) {
    const st = await fs.stat(src);
    if (st.isFile()) {
        await fs.link(src, dst);
        return;
    }

    if (st.isDirectory()) {
        const files = await fs.readdir(src);
        await fs.ensureDir(dst);

        for (const f of files) {
            await linkAll(path.join(src, f), path.join(dst, f));
        }
    }
}
