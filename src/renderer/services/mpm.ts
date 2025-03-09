import type { MpmAddonType } from "@/main/mpm/spec";
import { mpmSlice } from "@/renderer/store/mpm";
import { globalStore } from "@/renderer/store/store";

async function addAddon(gameId: string, type: MpmAddonType, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        await native.mpm.addAddons(gameId, [`modrinth:${type}:${id}:`]);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

async function removeAddon(gameId: string, type: MpmAddonType, id: string) {
    globalStore.dispatch(mpmSlice.actions.markInstalling({ gameId, id }));

    try {
        await native.mpm.removeAddons(gameId, [`modrinth:${type}:${id}:`]);
    } finally {
        globalStore.dispatch(mpmSlice.actions.unmarkInstalling({ gameId, id }));
    }
}

export const remoteMpm = {
    addAddon,
    removeAddon
};
