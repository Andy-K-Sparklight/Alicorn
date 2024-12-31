// Runs the development build and starts frontend hot-reloading server
import esbuild, { type BuildOptions } from "esbuild";
import typiaPlugin from "@ryoppippi/unplugin-typia/esbuild";
import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import fs from "fs-extra";
import { buildDefines } from "~/config";
import path from "path";
import consola from "consola";
import { build, createServer } from "vite";
import * as child_process from "node:child_process";

process.chdir(import.meta.dirname);

const isDev = !process.env.NODE_ENV?.includes("prod");

const outputDir = path.resolve(import.meta.dirname, "dist", isDev ? "dev" : "prod");

const defines = {
    "__dirname": "import.meta.dirname",
    "__filename": "import.meta.filename",
    ...buildDefines
};

const sharedOptions: BuildOptions = {
    sourcemap: isDev && "linked",
    bundle: true,
    minify: !isDev,
    platform: "node",
    external: ["electron", "original-fs"],
    define: defines,
    outdir: outputDir,
    metafile: true
};

const mainBuildOptions: BuildOptions = {
    entryPoints: {
        main: "src/main/main.ts"
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
if (JSON.parse(buildDefines["import.meta.env.AL_ENABLE_NATIVE_LZMA"])) {
    await fs.copy("node_modules/lzma-native/prebuilds", path.join(outputDir, "natives/lzma-native/prebuilds"));
}

consola.start("Running build for main module...");
const buildResult = await esbuild.build(mainBuildOptions);
await fs.outputJSON(path.join(outputDir, ".local/build.meta.json"), buildResult.metafile);
consola.success("Main module build process completed.");

consola.start("Running build for preload module...");
await esbuild.build(preloadBuildOptions);
consola.success("Preload module build process completed.");

const viteConfig = path.resolve(import.meta.dirname, "vite.config.ts");

if (isDev) {
    consola.start("Starting renderer development server...");

    const server = await createServer({ configFile: viteConfig });

    await server.listen();

    consola.start("Starting Electron process...");
    const electronExec = path.resolve(import.meta.dirname, "node_modules", "electron", "cli.js");
    const proc = child_process.fork(electronExec, ["."], {
        env: {
            ...process.env,
            ALICORN_DEV_SERVER: "1"
        },
        cwd: outputDir
    });

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
    await build({ configFile: viteConfig });
    consola.success("Renderer module build process completed.");
}

consola.success("Done.");
