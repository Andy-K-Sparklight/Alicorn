import { accountsSlice } from "@/renderer/store/accounts";
import { confSlice } from "@/renderer/store/conf";
import { gamesSlice } from "@/renderer/store/games";
import { installProgressSlice } from "@/renderer/store/install-progress";
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

export const globalStore = configureStore({
    reducer: {
        installProgress: installProgressSlice.reducer,
        games: gamesSlice.reducer,
        conf: confSlice.reducer,
        accounts: accountsSlice.reducer
    }
});

export const useAppDispatch = useDispatch.withTypes<typeof globalStore.dispatch>();
export const useAppSelector = useSelector.withTypes<ReturnType<typeof globalStore.getState>>();
