import type { GameProfile } from "@/main/game/spec";
import { useEffect, useState } from "react";

export function useGameList(): GameProfile[] | null {
    const [games, setGames] = useState<GameProfile[] | null>(null);

    function load() {
        native.game.list().then(setGames);
    }

    useEffect(() => {
        load();

        native.game.onChange(load);
        return () => native.game.offChange(load);
    }, []);

    return games;
}
