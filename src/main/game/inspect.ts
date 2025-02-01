import type { GameProfileDetail } from "@/main/game/spec";
import { reg } from "@/main/registry/registry";

/**
 * Creates a detailed summary object for the specified game.
 */
async function tellGame(gameId: string): Promise<GameProfileDetail> {
    const game = reg.games.get(gameId);

    return {
        id: game.id,
        name: game.name,
        versionId: game.launchHint.profileId, // TODO add support for mod loader
        gameVersion: game.virtual.baseVersion,
        installed: game.installed,
        modLoader: game.virtual.modLoader,
        stable: game.virtual.type === "release"
    };
}

export const gameInspector = { tellGame };
