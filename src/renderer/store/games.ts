import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GameProfile } from "@/main/game/spec";

type GameListSliceState = {
    games: Record<string, GameProfile>;
};
export const gamesSlice = createSlice({
    name: "games",
    initialState: {
        games: {},
    } as GameListSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ games: GameProfile[] }>) {
            state.games = Object.fromEntries(action.payload.games.map(it => [it.id, it]));
        },
    },
});
