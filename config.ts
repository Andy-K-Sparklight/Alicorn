export const DEV_SERVER_PORT = 9000;

const isDev = !process.env.NODE_ENV?.includes("prod");

// BMCLAPI provides mirrors to speed up resources delivering in some regions.
// As a non-free third-party service, it's not enabled by default.
// By changing the option to 'true' you agree the terms and conditions listed at <https://bmclapi2.bangbang93.com>.
const enableBMCLAPI = false;

// Local accounts are used to test the launcher features in development only.
// Launching the game without a valid account is not supported and therefore not included by default.
// By changing the option to 'true' you are at your own risk of breaking the EULA.
const enableLocalAccount = false;

// Decompression of LZMA is handled by lzma-native by default, yet not available on all platforms.
// Disabling this option enforces Alicorn to fall back to a pure JavaScript implementation.
// JavaScript version can be slower and does not support streaming.
const enableNativeLZMA = true;

export const buildDefines = {
    "import.meta.env.AL_DEV": JSON.stringify(isDev),
    "import.meta.env.AL_ENABLE_BMCLAPI": JSON.stringify(enableBMCLAPI),
    "import.meta.env.AL_ENABLE_LOCAL_ACCOUNT": JSON.stringify(enableLocalAccount),
    "import.meta.env.AL_DEV_SERVER_PORT": JSON.stringify(DEV_SERVER_PORT),
    "import.meta.env.AL_ENABLE_NATIVE_LZMA": JSON.stringify(enableNativeLZMA)
};