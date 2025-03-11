import { type MpmAddonType, type MpmManifest, MpmPackageSpecifier } from "@/main/mpm/spec";
import { useGameProfile } from "@/renderer/services/games";

import { mpmSlice } from "@/renderer/store/mpm";
import { type AppState, globalStore, useAppSelector } from "@/renderer/store/store";
import { createSelector } from "@reduxjs/toolkit";
import { useEffect } from "react";

native.mpm.onManifestChange((gameId, manifest) => {
    globalStore.dispatch(mpmSlice.actions.replaceManifest({ gameId, manifest }));
});

async function addAddon(gameId: string, type: MpmAddonType, vendor: string, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        await native.mpm.addAddons(gameId, [`${vendor}:${type}:${id}:`]);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

async function removeAddon(gameId: string, type: MpmAddonType, vendor: string, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        await native.mpm.removeAddons(gameId, [`${vendor}:${type}:${id}:`]);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

export const remoteMpm = {
    addAddon,
    removeAddon
};
const selectAddonInstallStatus = createSelector(
    [
        (s: AppState) => s.mpm.installingAddons,
        (_, gameId: string, __: string) => gameId,
        (_, __: string, id: string) => id
    ],
    (installingMods, gameId, id) => {
        return installingMods.some(m => m.gameId === gameId && m.id === id);
    }
);
export type AddonInstallStatus = "installed" | "auto-installed" | "installing" | "not-installed";

export function useMpmManifest(gameId: string): MpmManifest | null {
    useEffect(() => {
        if (globalStore.getState().mpm.manifests[gameId]) return;

        native.mpm.loadManifest(gameId).then(mf => {
            globalStore.dispatch(mpmSlice.actions.replaceManifest({ gameId, manifest: mf }));
        });

    }, [gameId]);

    return useAppSelector(s => s.mpm.manifests[gameId]) ?? null;
}

export function useAddonInstallStatus(gameId: string, id: string, vendor: string): AddonInstallStatus {
    const game = useGameProfile(gameId);

    const isInstalling = useAppSelector(s => selectAddonInstallStatus(s, gameId, id));

    if (!game) throw `Could not find corresponding game: ${gameId}`;

    const manifest = useMpmManifest(gameId);

    if (!manifest) return "not-installed";

    if (manifest.userPrompt.some(spec => {
        const ss = new MpmPackageSpecifier(spec);
        return ss.vendor === vendor && ss.id === id;
    })) {
        return "installed";
    }

    if (manifest.resolved.some(p => p.id === id)) return "auto-installed";

    return isInstalling ? "installing" : "not-installed";
}
