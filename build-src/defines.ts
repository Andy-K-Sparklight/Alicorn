import { type BuildConfig } from "~/config";

export type OSName = "windows" | "osx" | "linux"

function genBuildDefines(config: BuildConfig) {
    const {
        enableBMCLAPI,
        enableNativeLZMA,
        enableBundledAria2,
        devServerPort,
        variant: { mode, platform, arch }
    } = config;

    const osNames: Record<string, OSName> = {
        win32: "windows",
        darwin: "osx",
        linux: "linux"
    };

    return {
        AL_DEV: mode === "development",
        AL_TEST: mode === "test",
        AL_PLATFORM: platform,
        AL_OS: osNames[platform],
        AL_ARCH: arch,
        AL_ENABLE_BMCLAPI: enableBMCLAPI,
        AL_DEV_SERVER_PORT: devServerPort,
        AL_ENABLE_NATIVE_LZMA: enableNativeLZMA,
        AL_ENABLE_BUNDLED_ARIA2: enableBundledAria2
    };
}

function transformBuildDefines(def: BuildDefines): Record<string, string> {
    const o: Record<string, string> = {};

    for (const [k, v] of Object.entries(def)) {
        o["import.meta.env." + k] = JSON.stringify(v);
    }

    return o;
}

export function createBuildDefines(config: BuildConfig): Record<string, string> {
    return transformBuildDefines(genBuildDefines(config));
}

export type BuildDefines = ReturnType<typeof genBuildDefines>;
