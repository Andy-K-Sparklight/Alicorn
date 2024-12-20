declare global {
    interface ImportMeta {
        env: {
            AL_DEV: boolean;
            AL_DEV_SERVER_PORT: number;
            AL_ENABLE_BMCLAPI: boolean;
            AL_ENABLE_LOCAL_ACCOUNT: boolean;
        };
    }

    namespace NodeJS {
        interface ProcessEnv {
            ALICORN_DEV_SERVER?: string;
            ALICORN_CONFIG_PATH?: string;
            ALICORN_STORE_PATH?: string;
        }
    }
}


export {};