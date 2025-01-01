export interface BuildVariant {
    mode: "development" | "production";
    platform: string;
    arch: string;
}

export function createBuildConfig(variant: BuildVariant) {
    const { platform, arch } = variant;

    return {
        // Build variant object.
        variant,

        // BMCLAPI provides mirrors to speed up resources delivering in some regions.
        // As a non-free third-party service, it's not enabled by default.
        // By changing the option to 'true' you agree the terms and conditions listed at <https://bmclapi2.bangbang93.com>.
        enableBMCLAPI: false,

        // Local accounts are used to test the launcher features in development only.
        // Launching the game without a valid account is not supported and therefore not included by default.
        // By changing the option to 'true' you are at your own risk of breaking the EULA.
        enableLocalAccount: false,

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