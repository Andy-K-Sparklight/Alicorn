import type { GameProfile } from "@/main/game/spec";
import { gamesSlice } from "@/renderer/store/games";
import { globalStore, useAppSelector } from "@/renderer/store/store";

native.game.onChange(load);
void load();

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
