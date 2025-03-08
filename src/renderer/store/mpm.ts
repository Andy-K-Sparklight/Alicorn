import type { MpmManifest } from "@/main/mpm/pm";
import { useGameProfile } from "@/renderer/store/games";
import { type AppState, globalStore, useAppSelector } from "@/renderer/store/store";
import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useEffect } from "react";

interface MpmSliceState {
    installingMods: { gameId: string, id: string }[];
    manifests: Record<string, MpmManifest>;
}

native.mpm.onManifestChange((gameId, manifest) => {
    globalStore.dispatch(mpmSlice.actions.replaceManifest({ gameId, manifest }));
});

export const mpmSlice = createSlice({
    name: "mpm",
    initialState: {
        installingMods: [],
        manifests: {}
    } as MpmSliceState,
    reducers: {
        markInstalling: (state, action: PayloadAction<{ gameId: string, id: string }>) => {
            state.installingMods.push(action.payload);
        },

        unmarkInstalling: (state, action: PayloadAction<{ gameId: string, id: string }>) => {
            const { gameId, id } = action.payload;
            state.installingMods = state.installingMods
                .filter(m => !(m.gameId === gameId && m.id === id));
        },

        replaceManifest: (state, action: PayloadAction<{ gameId: string, manifest: MpmManifest }>) => {
            const { gameId, manifest } = action.payload;
            state.manifests[gameId] = manifest;
        }
    }
});

const selectModInstallStatus = createSelector(
    [
        (s: AppState) => s.mpm.installingMods,
        (_, gameId: string, __: string) => gameId,
        (_, __: string, id: string) => id
    ],
    (installingMods, gameId, id) => {
        return installingMods.some(m => m.gameId === gameId && m.id === id);
    }
);

export type ModInstallStatus = "installed" | "auto-installed" | "installing" | "not-installed";

function useMpmManifest(gameId: string): MpmManifest | null {
    useEffect(() => {
        if (globalStore.getState().mpm.manifests[gameId]) return;

        native.mpm.loadManifest(gameId).then(mf => {
            globalStore.dispatch(mpmSlice.actions.replaceManifest({ gameId, manifest: mf }));
        });

    }, [gameId]);

    return useAppSelector(s => s.mpm.manifests[gameId]) ?? null;
}

export function useModInstallStatus(gameId: string, id: string): ModInstallStatus {
    const game = useGameProfile(gameId);

    const isInstalling = useAppSelector(s => selectModInstallStatus(s, gameId, id));

    if (!game) throw `Could not find corresponding game: ${gameId}`;

    const manifest = useMpmManifest(gameId);

    if (!manifest) return "not-installed";

    if (manifest.userPrompt.some(spec => {
        const ss = spec.split(":", 2);
        return ss[0] === "modrinth" && ss[1] === id;
    })) {
        return "installed";
    }

    if (manifest.resolved.some(p => p.id === id)) return "auto-installed";

    return isInstalling ? "installing" : "not-installed";
}
