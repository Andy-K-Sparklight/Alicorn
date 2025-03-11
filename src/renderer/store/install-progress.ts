import type { Progress } from "@/main/util/progress";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface InstallProgressSliceState {
    installing: string[];
    progress: Record<string, Progress>;
}

export const installProgressSlice = createSlice({
    name: "installProgress",
    initialState: {
        installing: [],
        progress: {}
    } as InstallProgressSliceState,
    reducers: {
        markInstalling: (state, action: PayloadAction<{ gameId: string }>) => {
            state.installing = Array.from(new Set([...state.installing, action.payload.gameId]));
        },

        update: (state, action: PayloadAction<{ gameId: string, progress: Progress }>) => {
            state.progress[action.payload.gameId] = action.payload.progress;
        },

        reset: (state, action: PayloadAction<{ gameId: string }>) => {
            state.installing = state.installing.filter(id => id !== action.payload.gameId);
            delete state.progress[action.payload.gameId];
        }
    }
});
