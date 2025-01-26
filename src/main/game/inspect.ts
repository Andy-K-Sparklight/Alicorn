import { containers } from "@/main/container/manage";
import type { GameSummary } from "@/main/game/spec";
import { profileInspector } from "@/main/profile/inspect";
import { profileLoader } from "@/main/profile/loader";
import { reg } from "@/main/registry/registry";

/**
 * Creates a detailed summary object for the specified game.
 */
async function tellGame(gameId: string): Promise<GameSummary> {
    const game = reg.games.get(gameId);
    const container = containers.get(game.launchHint.containerId);
    const profile = await profileLoader.fromContainer(game.launchHint.profileId, container);
    const profileSummary = profileInspector.summarize(profile);

    return {
        id: game.id,
        name: game.name,
        versionId: profile.id,
        gameVersion: profileSummary.gameVersion,
        installed: game.installed,
        isModded: profileSummary.isModded,
        modLoader: profileSummary.modLoader
    };
}

export const gameInspector = { tellGame };
