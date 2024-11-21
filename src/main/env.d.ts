declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ALICORN_DEV: boolean;
            ALICORN_DEV_SERVER: string;
        }
    }
}

export {};