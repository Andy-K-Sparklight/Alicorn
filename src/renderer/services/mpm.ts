import { alter } from "@/main/util/misc";
import { mpmSlice } from "@/renderer/store/mpm";
import { globalStore } from "@/renderer/store/store";

async function addMod(gameId: string, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        const game = globalStore.getState().games.games.find(g => g.id === gameId)!;
        const ng = alter(game, g => g.mpm.userPrompt.push(`modrinth:${id}:`));

        await native.game.update(ng);
        await native.mpm.updateMods(gameId);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

export const remoteMpm = {
    addMod
};
