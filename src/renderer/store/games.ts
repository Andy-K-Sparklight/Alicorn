import type { GameProfile } from "@/main/game/spec";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type GameListSliceState = {
    games: GameProfile[];
}
export const gamesSlice = createSlice({
    name: "games",
    initialState: {
        games: []
    } as GameListSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ games: GameProfile[] }>) {
            state.games = action.payload.games;
        }
    }
});
