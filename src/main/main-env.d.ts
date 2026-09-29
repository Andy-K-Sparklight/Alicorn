declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ALICORN_CONFIG_PATH?: string;
            ALICORN_NATIVE_NAME: string;
            ALICORN_NATIVE_SHA256: string;
        }
    }
}

export {};
