import esbuild, { type BuildOptions } from "esbuild";
import typiaPlugin from "@ryoppippi/unplugin-typia/esbuild";
import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import fs, { copy, ensureDir } from "fs-extra";
import { buildDefines } from "~/build-config";
import path from "path";
import consola from "consola";

const isDev = !(process.env.NODE_ENV?.includes("prod"));
const isWatch = process.argv.includes("--watch");
const outputDir = path.resolve("dist", isDev ? "dev" : "prod");

const buildOptions: BuildOptions = {
    entryPoints: {
        main: "src/main/main.ts",
        preload: "src/preload/preload.ts"
    },
    plugins: [
        typiaPlugin({ cache: true, log: false }),
        TsconfigPathsPlugin({ tsconfig: "./tsconfig.json" })
    ],
    sourcemap: isDev && "linked",
    minify: !isDev,
    bundle: true,
    platform: "node",
    external: ["electron", "original-fs"],
    outdir: outputDir,
    define: buildDefines,
    metafile: true
};

consola.start(`Creating output directory at ${outputDir}`);
await ensureDir("dist");

consola.start("Copying assets...");
await copy("assets", outputDir);

if (isWatch) {
    consola.start("Entering watch mode...");
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
} else {
    consola.start("Running build...");
    const buildResult = await esbuild.build(buildOptions);
    await fs.outputJSON(path.join(outputDir, ".local/build.meta.json"), buildResult.metafile);
    consola.success("Build process completed.");
}
