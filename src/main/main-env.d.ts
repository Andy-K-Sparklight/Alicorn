declare global {
    interface ImportMeta {
        env: {
            ALICORN_DEV: boolean;
            ALICORN_DEV_SERVER_PORT: number;
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