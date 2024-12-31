declare global {
    interface ImportMeta {
        env: {
            AL_DEV: boolean;
            AL_DEV_SERVER_PORT: number;
            AL_ENABLE_BMCLAPI: boolean;
            AL_ENABLE_LOCAL_ACCOUNT: boolean;
            AL_ENABLE_NATIVE_LZMA: boolean;
        };
    }
}


export {};