declare global {
    interface ImportMeta {
        env: {
            ALICORN_DEV: boolean;
            ALICORN_DEV_SERVER: string;
        };
    }
}


export {};