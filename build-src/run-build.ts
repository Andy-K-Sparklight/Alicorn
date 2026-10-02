// Runs the development build and starts frontend hot-reloading server

import * as child_process from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import * as util from "node:util";
import { NapiCli } from "@napi-rs/cli";
import consola from "consola";
import esbuild, { type BuildOptions } from "esbuild";
import fs from "fs-extra";
import { pEvent } from "p-event";
import * as vite from "vite";
import { processResources } from "~/build-src/resources";
import { checksumOf } from "~/build-src/util.ts";
import { type BuildVariant, createBuildConfig } from "~/config";
import { createBuildDefines } from "./defines";
import { startInstrumentedTest } from "./instrumented-test";
import { layout } from "./layout.ts";

export async function build(variant: BuildVariant) {
    const cfg = createBuildConfig(variant);
    const defs = createBuildDefines(cfg);

    const { outputDir } = cfg;

    consola.info(`target: ${cfg.variant.platform}-${cfg.variant.arch}`);

    consola.box(util.inspect(cfg, { colors: true, depth: null }));

    const isDev = cfg.variant.mode === "development";
    const isProd = cfg.variant.mode === "production";

    await fs.emptyDir(outputDir);

    // NAPI build

    consola.start("build: natives");

    const nativeBuild = await new NapiCli().build({
        package: "alicorn-napi",
        platform: true,
        target: asNativeTarget(cfg.variant.platform, cfg.variant.arch),
        outputDir: path.join(outputDir, "r"),
        release: isProd,
        cwd: layout.root,
        verbose: true,
    });

    const nativeLibPath = (await nativeBuild.task).find(it => it.kind === "node")!.path;
    const nativeLibName = path.basename(nativeLibPath);
    const nativeHash = await checksumOf(nativeLibPath, "sha256");

    consola.info(`Native library at ${nativeLibPath} (SHA256: ${nativeHash})`);

    // JS build

    const defines = {
        NODE_ENV: isDev ? '"development"' : '"production"',
        __dirname: "import.meta.dirname",
        __filename: "import.meta.filename",
        "process.env.ALICORN_NATIVE_NAME": `"${nativeLibName}"`,
        "process.env.ALICORN_NATIVE_SHA256": `"${nativeHash}"`,
        ...defs,
    };

    const sharedOptions: BuildOptions = {
        absWorkingDir: layout.root,
        tsconfig: path.join(layout.root, "tsconfig.json"),
        sourcemap: isDev && "linked",
        bundle: true,
        minify: !isDev,
        platform: "node",
        external: ["electron", "original-fs"],
        define: defines,
        outdir: outputDir,
        legalComments: "none",
        drop: isProd ? ["console", "debugger"] : [],
    };

    const mainBuildOptions: BuildOptions = {
        entryPoints: {
            main: "src/main/main.ts",
            boot: "src/main/sys/boot.ts",
        },
        chunkNames: "[hash]",
        splitting: true,
        format: "esm",
        banner: {
            // A patch to make require available
            js: 'import { createRequire } from "node:module";\nglobal.require = createRequire(import.meta.url);\n',
        },
        ...sharedOptions,
    };

    const preloadBuildOptions: BuildOptions = {
        entryPoints: {
            preload: "src/preload/preload.ts",
        },
        ...sharedOptions,
    };

    await processResources(cfg);

    consola.start("build: main");
    await esbuild.build(mainBuildOptions);

    consola.start("build: preload");
    await esbuild.build(preloadBuildOptions);

    consola.start("build: renderer");
    const viteConfigFile = path.join(import.meta.dirname, "vite-config.ts");
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
        await startInstrumentedTest(outputDir);
    }

    consola.success("done.");
}

function asNativeTarget(platform: string, arch: string): string {
    let nativeArch = "";
    let nativePlatform = "";

    switch (platform) {
        case "win32":
            nativePlatform = "-pc-windows-gnullvm";
            break;
        case "darwin":
            nativePlatform = "-apple-darwin";
            break;
        case "linux":
            nativePlatform = "-unknown-linux-gnu";
            break;
    }

    switch (arch) {
        case "x64":
            nativeArch = "x86_64";
            break;
        case "arm64":
            nativeArch = "aarch64";
            break;
    }

    return nativeArch + nativePlatform;
}

async function runElectronDev(appDir: string) {
    consola.start("start: electron app");
    const electronExec = createRequire(import.meta.url).resolve("electron/cli.js");
    const proc = child_process.fork(electronExec, ["--trace-warnings", "."], { cwd: appDir });

    // Forward Ctrl-C to the app
    process.once("SIGINT", () => {
        consola.info("Closing Electron app...");
        proc.kill();
    });

    await pEvent(proc, "exit");
}
