import type { VanillaInstallEvent } from "@/main/api/install";
import type { Progress } from "@/main/util/progress";
import { retrievePort } from "@/preload/message";
import Emittery from "emittery";
import { t } from "i18next";
import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

// Maps game ID to its event target
const globalEmitter = new Emittery();
const progressMap = new Map<string, Progress>();

async function install(gameId: string): Promise<void> {
    native.install.installGame(gameId);
    const port = await retrievePort(gameId);

    // Emits change event at most once per idle callback
    // This does not block the render operations, while making the status to update as fast as possible
    let shouldEmitChange = false;

    function emitChange() {
        if (shouldEmitChange) return;
        requestIdleCallback(() => {
            globalEmitter.emit(`change:${gameId}`);
            shouldEmitChange = false;
        });
    }

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
                    toast.success(t("toast.game-installed"));
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
