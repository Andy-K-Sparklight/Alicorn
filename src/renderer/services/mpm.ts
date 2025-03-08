import { mpmSlice } from "@/renderer/store/mpm";
import { globalStore } from "@/renderer/store/store";

async function addMod(gameId: string, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        await native.mpm.addMods(gameId, [`modrinth:${id}:`]);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

async function removeMod(gameId: string, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        await native.mpm.removeMods(gameId, [`modrinth:${id}:`]);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

export const remoteMpm = {
    addMod,
    removeMod
};
