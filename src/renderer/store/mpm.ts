import type { MpmManifest } from "@/main/mpm/spec";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MpmSliceState {
    installingAddons: { gameId: string, id: string }[];
    manifests: Record<string, MpmManifest>;
}

export const mpmSlice = createSlice({
    name: "mpm",
    initialState: {
        installingAddons: [],
        manifests: {}
    } as MpmSliceState,
    reducers: {
        markInstalling: (state, action: PayloadAction<{ gameId: string, id: string }>) => {
            state.installingAddons.push(action.payload);
        },

        unmarkInstalling: (state, action: PayloadAction<{ gameId: string, id: string }>) => {
            const { gameId, id } = action.payload;
            state.installingAddons = state.installingAddons
                .filter(m => !(m.gameId === gameId && m.id === id));
        },

        replaceManifest: (state, action: PayloadAction<{ gameId: string, manifest: MpmManifest }>) => {
            const { gameId, manifest } = action.payload;
            state.manifests[gameId] = manifest;
        }
    }
});
