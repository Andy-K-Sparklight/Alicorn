import { type RemoteGameProcess, useGameProcDetail } from "@/renderer/services/proc";
import React, { type PropsWithChildren, useContext } from "react";

const GameProcessContext = React.createContext<RemoteGameProcess | null>(null);

export function GameProcessProvider({ children, procId }: PropsWithChildren<{ procId: string }>) {
    const proc = useGameProcDetail(procId);
    return <GameProcessContext.Provider value={proc}>
        {children}
    </GameProcessContext.Provider>;
}

export function useCurrentProc(): RemoteGameProcess {
    const p = useContext(GameProcessContext);
    if (!p) {
        throw "Should not try to retrieve game process information outside its provider.";
    }
    return p;
}
