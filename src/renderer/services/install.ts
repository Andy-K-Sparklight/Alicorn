import type { VanillaInstallEvent } from "@/main/api/install";
import type { Progress } from "@/main/util/progress";
import { retrievePort } from "@/preload/message";
import Emittery from "emittery";
import { useCallback, useSyncExternalStore } from "react";
import throttle from "throttleit";

// Maps game ID to its event target
const globalEmitter = new Emittery();
const progressMap = new Map<string, Progress>();

async function install(gameId: string): Promise<void> {
    native.install.installVanilla(gameId);
    const port = await retrievePort(gameId);

    const emitChange = throttle(() => globalEmitter.emit(`change:${gameId}`), 100);

    // TODO add rej error handler
    return new Promise(res => {
        port.onmessage = (e: MessageEvent<VanillaInstallEvent>) => {
            switch (e.data.type) {
                case "progress":
                    progressMap.set(gameId, e.data.progress);
                    break;
                case "finish":
                    port.close();
                    progressMap.delete(gameId);
                    res();
                    break;
            }

            // Progress events come at a very high rate and must be throttled for acceptable performance
            // It's guaranteed the last call ("finish") will not be ignored
            emitChange();
        };
    });
}

function makeSubscribe(gameId: string) {
    return (onStoreChange: () => void) => {
        const ch = `change:${gameId}`;
        globalEmitter.on(ch, onStoreChange);

        return () => globalEmitter.off(ch, onStoreChange);
    };
}

function makeGetSnapshot(gameId: string): () => Progress | null {
    return () => progressMap.get(gameId) ?? null;
}

export function useInstallProgress(gameId: string): Progress | null {
    const subscribe = useCallback(makeSubscribe(gameId), [gameId]);
    const getSnapshot = useCallback(makeGetSnapshot(gameId), [gameId]);

    return useSyncExternalStore(subscribe, getSnapshot);
}

export const remoteInstaller = {
    install
};
