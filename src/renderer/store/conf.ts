import type { UserConfig } from "@/main/conf/conf";
import { alter } from "@/main/util/misc";
import { globalStore, useAppSelector } from "@/renderer/store/store";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

native.conf.onChange(handleChange);
native.conf.get().then(handleChange);

type ConfSliceState = {
    config: UserConfig | null;
}

export const confSlice = createSlice({
    name: "conf",
    initialState: {
        config: null
    } as ConfSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ config: UserConfig | null }>) {
            state.config = action.payload.config;
        }
    }
});

function handleChange(c: UserConfig) {
    globalStore.dispatch(
        confSlice.actions.replace({ config: c })
    );
}

export function useConfig() {
    const config = useAppSelector(s => s.conf.config);

    function alterConfig(update: (c: UserConfig) => void) {
        if (!config) return;

        native.conf.update(alter(config, update));
    }

    return { config, alterConfig };
}
