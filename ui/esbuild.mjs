import esbuild from "esbuild";
import copy from "esbuild-plugin-copy";
import * as fs from "node:fs";

const buildType = (process.argv[2] || "debug").toLowerCase();
const isWatch = (process.argv[3] || "").toLowerCase() === "watch";
const isRelease = buildType === "release" || buildType === "prod" || buildType === "production";
const isDebug = buildType === "debug" || buildType === "dev" || buildType === "development";
const outputDir = "build/esbuild/" + (isDebug ? "debug" : "release");

fs.mkdirSync(outputDir, { recursive: true });

const buildOptions = {
    bundle: true,
    minify: isRelease,
    jsx: "automatic",
    sourcemap: isDebug ? "inline" : false,
    entryPoints: ["src/main/js/Main.ts"],
    outfile: outputDir + "/ui.js",
    format: "iife",
    plugins: [
        copy({
            resolveFrom: "cwd",
            assets: [{
                from: "./src/main/resources/**/*",
                to: outputDir
            }, {
                from: "./node_modules/@shoelace-style/shoelace/dist/assets/**/*",
                to: outputDir
            }],
            watch: isWatch
        })
    ],
    banner: {
        js: isDebug && isWatch ? "(()=>{new EventSource('/esbuild').addEventListener('change',()=>{location.reload()});})();" : ""
    }
};

if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    let { ignored, port } = await ctx.serve({
        servedir: outputDir
    });
    console.log(`Development server started on port ${port}`);
} else {
    await esbuild.build(buildOptions);
}



