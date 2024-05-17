import * as esbuild from "esbuild";

const buildType = (process.argv[2] || "debug").toLowerCase();
const isRelease = buildType === "release" || buildType === "prod" || buildType === "production";
const isDebug = buildType === "debug" || buildType === "dev" || buildType === "development";
const outputDir = "build/esbuild/" + (isDebug ? "debug" : "release");

const buildOptions = {
    bundle: true,
    minify: isRelease,
    sourcemap: isDebug ? "inline" : false
};

await esbuild.build({
    entryPoints: ["src/main/js/Main.ts"],
    outfile: outputDir + "/neko.js",
    platform: "neutral",
    format: "iife",
    ...buildOptions
});
