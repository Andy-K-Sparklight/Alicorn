import type { GameProfile } from "@/main/game/spec";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type GameListSliceState = {
    games: Record<string, GameProfile>;
}
export const gamesSlice = createSlice({
    name: "games",
    initialState: {
        games: {}
    } as GameListSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ games: GameProfile[] }>) {
            for (const g of action.payload.games) {
                state.games[g.id] = g;
            }
        }
    }
});
