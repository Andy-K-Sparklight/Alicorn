// Runs the development build and starts frontend hot-reloading server
import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import consola from "consola";
import esbuild, { type BuildOptions } from "esbuild";
import fs from "fs-extra";
import * as child_process from "node:child_process";
import path from "node:path";
import * as util from "node:util";
import { pEvent } from "p-event";
import { dedent } from "ts-dedent";
import * as vite from "vite";
import { processResources } from "~/build-src/resources";
import { type BuildVariant, createBuildConfig } from "~/config";
import { createBuildDefines } from "./defines";
import { startInstrumentedTest } from "./instrumented-test";

export async function build(variant: BuildVariant) {
    const cfg = createBuildConfig(variant);
    const defs = createBuildDefines(cfg);

    const { outputDir } = cfg;

    consola.info(`target: ${cfg.variant.platform}-${cfg.variant.arch}`);

    consola.box(util.inspect(cfg, { colors: true, depth: null }));

    const isDev = cfg.variant.mode === "development";
    const isProd = cfg.variant.mode === "production";

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
        drop: isProd ? ["console"] : undefined,
        alias: {
            "readable-stream": "node:stream"
        },
        legalComments: "none"
    };

    const mainBuildOptions: BuildOptions = {
        entryPoints: {
            main: "src/main/main.ts",
            "hash-worker": "src/main/security/hash-worker.ts",
            boot: "src/main/sys/boot.ts"
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

    await processResources(cfg);

    consola.start("build: main");
    await esbuild.build(mainBuildOptions);

    consola.start("build: preload");
    await esbuild.build(preloadBuildOptions);

    const viteConfigFile = path.resolve(import.meta.dirname, "vite-config.ts");

    consola.start("build: renderer");
    if (isDev) {
        const server = await vite.createServer({
            configFile: viteConfigFile,
            server: { port: cfg.devServerPort, strictPort: true },
            define: defines
        });

        await server.listen();
        await runElectronDev(outputDir);
        await server.close();
    } else {
        await vite.build({
            configFile: viteConfigFile,
            define: defines,
            build: {
                outDir: path.join(outputDir, "renderer")
            }
        });
    }

    if (cfg.variant.mode === "test") {
        await startInstrumentedTest();
    }

    consola.success("done.");
}

async function runElectronDev(appDir: string) {
    consola.start("start: electron app");
    const electronExec = path.resolve(import.meta.dirname, "..", "node_modules", "electron", "cli.js");
    const proc = child_process.fork(electronExec, ["--trace-warnings", "."], { cwd: appDir });

    // Forward Ctrl-C to the app
    process.once("SIGINT", () => {
        consola.info("Closing Electron app...");
        proc.kill();
    });

    await pEvent(proc, "exit");
}
