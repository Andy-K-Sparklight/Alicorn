declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ALICORN_CONFIG_PATH?: string;
        }
    }
}


export {};
