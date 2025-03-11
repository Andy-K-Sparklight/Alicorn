import UserAgent from "user-agents";
import { type BuildConfig } from "~/config";

export type OSName = "windows" | "osx" | "linux"

function genBuildDefines(config: BuildConfig) {
    const {
        enableBMCLAPI,
        enableNativeLZMA,
        devServerPort,
        variant: { mode, platform, arch }
    } = config;

    const osNames: Record<string, OSName> = {
        win32: "windows",
        darwin: "osx",
        linux: "linux"
    };

    const fakeUAs = Array(20).fill(0).map(() => new UserAgent().toString());

    return {
        AL_DEV: mode === "development",
        AL_TEST: mode === "test",
        AL_PLATFORM: platform,
        AL_OS: osNames[platform],
        AL_ARCH: arch,
        AL_ENABLE_BMCLAPI: enableBMCLAPI,
        AL_DEV_SERVER_PORT: devServerPort,
        AL_ENABLE_NATIVE_LZMA: enableNativeLZMA,
        AL_FAKE_UAS: fakeUAs
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
