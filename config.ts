import path from "node:path";

export type BuildMode = "development" | "production" | "test"
export type TestLevel = "lite" | "medium" | "full";


export interface BuildVariant {
    mode: BuildMode;
    platform: string;
    arch: string;
    testLevel: TestLevel;
}

export function createBuildConfig(variant: BuildVariant) {
    const { platform, arch, mode } = variant;

    return {
        // Build variant object.
        variant,

        // Output directory
        outputDir: path.resolve(import.meta.dirname, "build", mode),

        // BMCLAPI provides mirrors to speed up resources delivering in some regions.
        // Make sure that the users read <https://bmclapi2.bangbang93.com>.
        enableBMCLAPI: true,

        // Decompression of LZMA is handled by lzma-native by default, yet not available on all platforms.
        // Disabling this option enforces Alicorn to fall back to a pure JavaScript implementation.
        // JavaScript version can be slower and does not support streaming.
        // This option is (by default) disabled for win32-arm64 and enabled for other platforms.
        enableNativeLZMA: !(platform === "win32" && arch === "arm64"),

        // Port to be used when hosting HMR content for renderer.
        devServerPort: 9000
    };
}

export type BuildConfig = ReturnType<typeof createBuildConfig>;
