import { accountsSlice } from "@/renderer/store/accounts";
import { confSlice } from "@/renderer/store/conf";
import { gamesSlice } from "@/renderer/store/games";
import { installProgressSlice } from "@/renderer/store/install-progress";
import { mpmSlice } from "@/renderer/store/mpm";
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

export const globalStore = configureStore({
    reducer: {
        installProgress: installProgressSlice.reducer,
        games: gamesSlice.reducer,
        conf: confSlice.reducer,
        accounts: accountsSlice.reducer,
        mpm: mpmSlice.reducer
    }
});

export type AppState = ReturnType<typeof globalStore.getState>;
export const useAppDispatch = useDispatch.withTypes<typeof globalStore.dispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();
