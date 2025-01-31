import type { GameProfile } from "@/main/game/spec";
import { useEffect, useState } from "react";

export function useGameList(): GameProfile[] {
    const [games, setGames] = useState<GameProfile[]>([]);

    useEffect(() => {
        native.game.list().then(setGames);
    }, []);

    return games;
}
