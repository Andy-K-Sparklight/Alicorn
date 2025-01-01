declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ALICORN_CONFIG_PATH?: string;
            ALICORN_STORE_PATH?: string;
        }
    }
}


export {};