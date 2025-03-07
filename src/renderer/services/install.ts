import type { VanillaInstallEvent } from "@/main/api/install";
import type { Progress } from "@/main/util/progress";
import { retrievePort } from "@/preload/message";
import { installProgressSlice } from "@/renderer/store/install-progress";
import { globalStore, useAppSelector } from "@/renderer/store/store";
import { addToast } from "@heroui/react";
import { t } from "i18next";

async function install(gameId: string): Promise<void> {
    native.install.installGame(gameId);
    const port = await retrievePort(gameId);

    const { promise, resolve, reject } = Promise.withResolvers<void>();

    let dispatched = false;
    let finished = false;

    function throttledDispatchUpdate(progress: Progress) {
        if (dispatched) return;
        dispatched = true;
        requestIdleCallback(() => {
            if (finished) return;
            globalStore.dispatch(
                installProgressSlice.actions.update({ gameId, progress })
            );
            dispatched = false;
        });
    }


    function dispatchReset() {
        globalStore.dispatch(
            installProgressSlice.actions.reset({ gameId })
        );
    }

    port.onmessage = (e: MessageEvent<VanillaInstallEvent>) => {
        switch (e.data.type) {
            case "progress":
                throttledDispatchUpdate(e.data.progress);
                break;
            case "finish":
                finished = true;
                port.close();
                dispatchReset();
                addToast({
                    color: "success",
                    title: t("toast.game-installed")
                });
                resolve();
                break;
            case "error":
                finished = true;
                port.close();
                dispatchReset();
                reject(e.data.err);
                break;
        }
    };

    return promise;
}

export function useInstallProgress(gameId: string): Progress | null {
    const progress = useAppSelector(s => s.installProgress[gameId]);
    return progress ?? null;
}

export const remoteInstaller = {
    install
};
