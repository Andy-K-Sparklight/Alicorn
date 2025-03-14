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

    globalStore.dispatch(
        installProgressSlice.actions.markInstalling({ gameId })
    );

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

    function finalize() {
        finished = true;
        port.close();
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
                finalize();
                addToast({
                    color: "success",
                    title: t("toast.game-installed")
                });
                resolve();
                break;
            case "error":
                finalize();
                reject(e.data.err);
                break;
            case "cancelled":
                finalize();
                reject("Cancelled");
                break;
        }
    };

    return promise;
}

export const remoteInstaller = {
    install
};

export interface InstallProgressSlim {
    isInstalling: boolean;
    progress?: Progress;
}

export function useInstallProgress(gameId: string): InstallProgressSlim {
    const isInstalling = useAppSelector(s => s.installProgress.installing.includes(gameId));
    const progress = useAppSelector(s => s.installProgress.progress[gameId]);
    return { isInstalling, progress };
}
