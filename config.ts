import path from "node:path";

export type BuildMode = "development" | "production" | "test";
export type TestLevel = "lite" | "medium" | "full";

export interface BuildVariant {
    mode: BuildMode;
    platform: string;
    arch: string;
    testLevel: TestLevel;
}

export function createBuildConfig(variant: BuildVariant) {
    const { mode } = variant;

    return {
        // Build variant object.
        variant,

        // Output directory
        outputDir: path.resolve(import.meta.dirname, "build", mode),

        // BMCLAPI provides mirrors to speed up resources delivering in some regions.
        // Make sure that the users read <https://bmclapi2.bangbang93.com>.
        enableBMCLAPI: true,

        // Port to be used when hosting HMR content for renderer.
        devServerPort: 9000,
    };
}

export type BuildConfig = ReturnType<typeof createBuildConfig>;
