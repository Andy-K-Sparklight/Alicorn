import { games } from "@/main/game/manage";
import { addCheckedHandler } from "@/main/ipc/checked";
import { curse } from "@/main/mpm/curse";
import { mpmLock } from "@/main/mpm/lockfile";
import { modrinth } from "@/main/mpm/modrinth";
import { mpm } from "@/main/mpm/pm";
import type { MpmAddonMeta } from "@/main/mpm/spec";
import { distance } from "fastest-levenshtein";

interface AddonSearchPagination {
    offset: {
        modrinth: number;
        curse: number;
    };
}

export interface MpmAddonSearchResult {
    contents: MpmAddonMeta[];
    pagination: AddonSearchPagination;
}

addCheckedHandler("searchAddons", async (scope, query, gameId, pg?: AddonSearchPagination) => {
    const game = games.get(gameId);

    pg = pg || {
        offset: {
            modrinth: 0,
            curse: 0
        }
    };

    const res = await modrinth.search(scope, query, game.versions.game, game.type, pg.offset.modrinth);
    pg.offset.modrinth += res.length;

    const curseRes = await curse.search(scope, query, game.versions.game, game.type, pg.offset.curse);
    pg.offset.curse += curseRes.length;
    res.push(...curseRes);
    sortResults(res, query);

    return {
        contents: res,
        pagination: pg
    };
});

addCheckedHandler("updateAddons", async gameId => {
    await mpm.fullResolve(gameId);
});

addCheckedHandler("addAddons", async (gameId, specs) => {
    await mpm.addPackages(gameId, specs);
});

addCheckedHandler("removeAddons", async (gameId, specs) => {
    await mpm.removePackages(gameId, specs);
});

addCheckedHandler("loadMpmManifest", async (gameId) => {
    return await mpmLock.loadManifest(gameId);
});

/**
 * Sort results by Levenshtein distance.
 */
function sortResults(obj: MpmAddonMeta[], query: string) {
    const cache = new Map<string, number>();

    function getOrCompute(s: string, f: (s: string) => number) {
        let c = cache.get(s);
        if (c === undefined) {
            c = f(s);
            cache.set(s, c);
        }
        return c;
    }

    obj.sort((a, b) => {
        const al = getOrCompute(a.title.toLowerCase(), s => distance(s.toLowerCase(), query.toLowerCase()));
        const bl = getOrCompute(b.title.toLowerCase(), s => distance(s.toLowerCase(), query.toLowerCase()));

        if (al === bl) {
            // Prioritize Modrinth
            if (a.vendor === "modrinth" && b.vendor === "curse") return -1;
            if (a.vendor === "curse" && b.vendor === "modrinth") return 1;
        }

        return al - bl;
    });
}
