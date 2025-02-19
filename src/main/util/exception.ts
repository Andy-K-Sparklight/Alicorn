export type ExceptionType = {
    unknown: {}
    cancelled: {}
    "no-entry": { id: string }
    network: { url: string, code?: number }
    download: { url: string }
    auth: {}
    "fabric-no-version": { gameVersion: string }
    "quilt-no-version": { gameVersion: string }
    "profile-link": { id: string }
    "jrt-not-available": { component: string }
    "jrt-not-verified": { bin: string }
    "launch-spawn": {}
}

export interface ExceptionProps<K extends keyof ExceptionType> {
    ALICORN_EXCEPTION: true;
    type: K;
    detail: ExceptionType[K];
}

function create<K extends keyof ExceptionType>(type: K, detail: ExceptionType[K] & { error?: unknown }) {
    // Electron prohibits transferring arbitrary object as errors to the renderer
    // We serialize the data, prefix it with a special placeholder, then send it to the renderer
    // It will be restored there
    return "\0\0\0" + JSON.stringify({
        ALICORN_EXCEPTION: true,
        type,
        detail
    });
}

export const exceptions = { create };
