import type { GameProfile } from "@/main/game/spec";
import React, { type PropsWithChildren, useContext } from "react";

const GameProfileContext = React.createContext<GameProfile | null>(null);

export function GameProfileProvider({ children, game }: PropsWithChildren<{ game: GameProfile }>) {
    return <GameProfileContext.Provider value={game}>
        {children}
    </GameProfileContext.Provider>;
}

export function useCurrentGameProfile(): GameProfile {
    const g = useContext(GameProfileContext);

    if (!g) throw "Should not access game profile outside its provider";

    return g;
}
