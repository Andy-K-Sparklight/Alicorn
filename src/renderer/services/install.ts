import type { VanillaInstallEvent } from "@/main/api/install";
import type { Progress } from "@/main/util/progress";
import type { WindowMessageContent } from "@/renderer/util/message";
import { pEvent } from "p-event";
import { useCallback, useSyncExternalStore } from "react";
import throttle from "throttleit";

// Maps game ID to its event target
const emitters = new Map<string, EventTarget>();
const progressMap = new Map<string, Progress>();

function getEmitter(gameId: string): EventTarget {
    let et = emitters.get(gameId);
    if (!et) {
        et = new EventTarget();
        emitters.set(gameId, et);
    }
    return et;
}

async function install(gameId: string): Promise<void> {
    native.install.installVanilla(gameId);

    const pe = await pEvent(window, "message", (e: MessageEvent<WindowMessageContent>) => e.data.channel === `port:${gameId}`);

    const [port] = pe.ports;

    const et = getEmitter(gameId);

    const emitChange = throttle(() => et.dispatchEvent(new CustomEvent("change")), 100);

    port.onmessage = (e: MessageEvent<VanillaInstallEvent>) => {
        const d = e.data as VanillaInstallEvent;
        if (d.type === "progress") {
            progressMap.set(gameId, d.progress);
        }

        if (d.type === "finish") {
            progressMap.delete(gameId);
        }

        // Progress events come at a very high rate and must be throttled for acceptable performance
        // It's guaranteed the last call ("finish") will not be ignored
        emitChange();
    };

    await pEvent(port, "message", (e: MessageEvent<VanillaInstallEvent>) => e.data.type === "finish");

    port.close();
}

function makeSubscribe(gameId: string) {
    return (onStoreChange: () => void) => {
        const et = getEmitter(gameId);
        et.addEventListener("change", onStoreChange);

        return () => et.removeEventListener("change", onStoreChange);
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
