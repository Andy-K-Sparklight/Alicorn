// Runs the development build and starts frontend hot-reloading server

import * as child_process from "node:child_process";
import path from "node:path";
import * as util from "node:util";
import consola from "consola";
import fs from "fs-extra";
import { pEvent } from "p-event";
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
        NODE_ENV: isDev ? '"development"' : '"production"',
        __dirname: "import.meta.dirname",
        __filename: "import.meta.filename",
        ...defs,
    };

    const sharedConfig: any = {
        sourcemap: isDev && "linked",
        minify: !isDev,
        external: ["electron", "original-fs"],
        define: defines,
        naming: "[name].[ext]",
        outdir: outputDir,
        drop: isProd ? ["console", "debugger"] : [],
        target: "node",
    };

    const mainBuildConfig: Bun.BuildConfig = {
        entrypoints: [
            "src/main/main.ts",
            "src/main/security/hash-worker.ts",
            "src/main/workers/lzma.ts",
            "src/main/sys/boot.ts",
        ],
        splitting: true,
        format: "esm",
        ...sharedConfig,
    };

    const preloadBuildConfig: Bun.BuildConfig = {
        entrypoints: ["src/preload/preload.ts"],
        format: "cjs",
        ...sharedConfig,
    };

    await processResources(cfg);

    consola.start("build: main");
    await Bun.build(mainBuildConfig);

    consola.start("build: preload");
    await Bun.build(preloadBuildConfig);

    const viteConfigFile = path.resolve(import.meta.dirname, "vite-config.ts");

    consola.start("build: renderer");
    if (isDev) {
        const server = await vite.createServer({
            configFile: viteConfigFile,
            server: { port: cfg.devServerPort, strictPort: true },
            define: defines,
        });

        await server.listen();
        await runElectronDev(outputDir);
        await server.close();
    } else if (isProd) {
        await vite.build({
            configFile: viteConfigFile,
            define: defines,
            build: {
                outDir: path.join(outputDir, "renderer"),
            },
        });
    }

    if (cfg.variant.mode === "test") {
        await startInstrumentedTest();
    }

    consola.success("done.");
}

async function runElectronDev(appDir: string) {
    consola.start("start: electron app");
    const electronExec = path.resolve(
        import.meta.dirname,
        "..",
        "node_modules",
        "electron",
        "cli.js",
    );
    const proc = child_process.fork(electronExec, ["--trace-warnings", "."], { cwd: appDir });

    // Forward Ctrl-C to the app
    process.once("SIGINT", () => {
        consola.info("Closing Electron app...");
        proc.kill();
    });

    await pEvent(proc, "exit");
}
