import type { GameProfile } from "@/main/game/spec";
import { gamesSlice } from "@/renderer/store/games";
import { type AppState, globalStore, useAppSelector } from "@/renderer/store/store";
import { createSelector } from "@reduxjs/toolkit";

native.game.onChange(load);
void load();

async function load() {
    const games = await native.game.list();
    globalStore.dispatch(
        gamesSlice.actions.replace({ games })
    );
}

const selectGameList = createSelector(
    [
        (s: AppState) => s.games.games
    ],
    (games) => {
        return Object.values(games);
    }
);

export function useGameList(): GameProfile[] {
    return useAppSelector(selectGameList);
}

export function useGameProfile(id: string): GameProfile | null {
    const g = useAppSelector(s => s.games.games[id]);
    return g ?? null;
}
