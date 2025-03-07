import type { GameProfile } from "@/main/game/spec";
import { globalStore, useAppSelector } from "@/renderer/store/store";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

native.game.onChange(load);
void load();

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

async function load() {
    const games = await native.game.list();
    globalStore.dispatch(
        gamesSlice.actions.replace({ games })
    );
}

export function useGameList(): GameProfile[] {
    return useAppSelector(s => s.games.games);
}

export function useGameProfile(id: string): GameProfile | null {
    const games = useGameList();

    return games?.find(g => g.id === id) ?? null;
}
