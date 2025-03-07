import type { Progress } from "@/main/util/progress";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type InstallProgressSliceState = Record<string, Progress>

export const installProgressSlice = createSlice({
    name: "installProgress",
    initialState: {} as InstallProgressSliceState,
    reducers: {
        update: (state, action: PayloadAction<{ gameId: string, progress: Progress }>) => {
            state[action.payload.gameId] = action.payload.progress;
        },

        reset: (state, action: PayloadAction<{ gameId: string }>) => {
            delete state[action.payload.gameId];
        }
    }
});
