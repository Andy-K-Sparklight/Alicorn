import type { MpmAddonSearchResult } from "@/main/api/mpm";
import type { MpmAddonMeta, MpmAddonType } from "@/main/mpm/spec";
import { uniqueBy } from "@/main/util/misc";

interface AddonSearchOptions {
    search: (
        scope: MpmAddonType,
        query: string,
        pagination: MpmAddonSearchResult["pagination"] | null,
    ) => Promise<MpmAddonSearchResult>;
    onResults: (contents: MpmAddonMeta[]) => void;
    onFetching: (fetching: boolean) => void;
}

/**
 * Coordinates debounced add-on searches and publishes results from the current query.
 */
export function createAddonSearch({ search, onResults, onFetching }: AddonSearchOptions) {
    let generation = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fetching = false;
    let scope: MpmAddonType = "mods";
    let query = "";
    let pagination: MpmAddonSearchResult["pagination"] | null = null;
    let contents: MpmAddonMeta[] = [];

    function setFetching(value: boolean) {
        if (fetching === value) return;
        fetching = value;
        onFetching(value);
    }

    /**
     * Cancels scheduled searches and discards responses from running requests.
     * A subsequent refresh starts a new query.
     */
    function cancel() {
        generation++;
        clearTimeout(timer);
        timer = undefined;
        fetching = false;
        pagination = null;
        contents = [];
    }

    /**
     * Schedules a fresh search, resetting pagination and invalidating earlier requests immediately.
     */
    function refresh(nextScope: MpmAddonType = "mods", nextQuery = "") {
        cancel();
        scope = nextScope;
        query = nextQuery;
        setFetching(true);
        timer = setTimeout(() => {
            timer = undefined;
            void fetchItems(true);
        }, 500);
    }

    /**
     * Appends the next page with unique add-on IDs after a successful fresh search.
     * Does nothing while a search is pending and propagates failures of the current request.
     */
    async function loadMore() {
        if (fetching || pagination === null) return;
        await fetchItems(false);
    }

    async function fetchItems(fresh: boolean) {
        const id = generation;
        setFetching(true);
        try {
            const res = await search(scope, query, fresh ? null : pagination);
            if (id !== generation) return;

            pagination = res.pagination;
            contents = fresh ? res.contents : uniqueBy(contents.concat(res.contents), r => r.id);
            onResults(contents);
        } catch (ex) {
            if (id === generation) throw ex;
        } finally {
            if (id === generation) setFetching(false);
        }
    }

    return { refresh, loadMore, cancel };
}
