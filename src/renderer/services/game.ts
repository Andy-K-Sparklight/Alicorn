import type { GameProfile } from "@/main/game/spec";
import Emittery from "emittery";
import { useSyncExternalStore } from "react";

// Forward change events
// This setup only runs once
native.game.onChange(load);

void load();

const emitter = new Emittery();

let games: GameProfile[] | null = null;

async function load() {
    games = await native.game.list();
    void emitter.emit("change");
}

function subscribe(cb: () => void) {
    emitter.on("change", cb);

    return () => emitter.off("change", cb);
}

function getSnapshot() {
    if (!games) {
        void load();
    }
    return games;
}

export function useGameList(): GameProfile[] | null {
    return useSyncExternalStore(subscribe, getSnapshot);
}

export function useGameProfile(id: string): GameProfile | null {
    const games = useGameList();

    return games?.find(g => g.id === id) ?? null;
}
