declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ALICORN_DEV_SERVER?: string;
            ALICORN_CONFIG_PATH?: string;
            ALICORN_STORE_PATH?: string;
        }
    }
}


export {};