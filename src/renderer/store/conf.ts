import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserConfig } from "@/main/conf/conf";

type ConfSliceState = {
    config: UserConfig | null;
};
export const confSlice = createSlice({
    name: "conf",
    initialState: {
        config: null,
    } as ConfSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ config: UserConfig | null }>) {
            state.config = action.payload.config;
        },
    },
});
