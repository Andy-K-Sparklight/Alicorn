import { useGameProfile } from "@/renderer/store/games";
import { type AppState, useAppSelector } from "@/renderer/store/store";
import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MpmSliceState {
    installingMods: { gameId: string, id: string }[];
}

export const mpmSlice = createSlice({
    name: "mpm",
    initialState: {
        installingMods: []
    } as MpmSliceState,
    reducers: {
        markInstalling: (state, action: PayloadAction<{ gameId: string, id: string }>) => {
            state.installingMods.push(action.payload);
        },

        unmarkInstalling: (state, action: PayloadAction<{ gameId: string, id: string }>) => {
            const { gameId, id } = action.payload;
            state.installingMods = state.installingMods
                .filter(m => !(m.gameId === gameId && m.id === id));
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

export function useModInstallStatus(gameId: string, id: string): ModInstallStatus {
    const game = useGameProfile(gameId);

    const isInstalling = useAppSelector(s => selectModInstallStatus(s, gameId, id));

    if (!game) throw `Could not find corresponding game: ${gameId}`;

    if (game.mpm.userPrompt.some(spec => {
        const ss = spec.split(":", 2);
        return ss[0] === "modrinth" && ss[1] === id;
    })) {
        return "installed";
    }

    if (game.mpm.resolved.some(p => p.id === id)) return "auto-installed";

    return isInstalling ? "installing" : "not-installed";
}
