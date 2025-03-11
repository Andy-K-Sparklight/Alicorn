import type { MpmAddonMeta, MpmAddonType } from "@/main/mpm/spec";
import { uniqueBy } from "@/main/util/misc";
import { AddonMetaDisplay } from "@components/AddonMetaDisplay";
import { Input, Tab, Tabs } from "@heroui/react";
import { BlocksIcon, ImagesIcon, SearchIcon, SunIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStorage } from "react-use";
import { VList, type VListHandle } from "virtua";

interface AddonSearchListProps {
    gameId: string;
}

export function AddonSearchList({ gameId }: AddonSearchListProps) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.addons" });
    const transactionId = useRef(0);
    const fetching = useRef(false);
    const paginationRef = useRef<unknown>(null);
    const [results, setResults] = useSessionStorage<MpmAddonMeta[]>(`mod-search-results.${gameId}`, []);
    const vlistRef = useRef<VListHandle | null>(null);
    const searchDelayTimer = useRef<number | null>(null);

    const query = useRef("");
    const scope = useRef<MpmAddonType>("mods");

    useEffect(() => {
        initiateFreshQuery();
    }, []);

    function handleQueryChange(q: string) {
        query.current = q;
        initiateFreshQuery();
    }

    function handleScopeChange(s: string | number) {
        scope.current = s as MpmAddonType;
        initiateFreshQuery();
    }

    function initiateFreshQuery() {
        if (searchDelayTimer.current !== null) {
            window.clearTimeout(searchDelayTimer.current);
        }

        searchDelayTimer.current = window.setTimeout(() => fetchItems(true), 500);
    }

    function onScroll() {
        if (vlistRef.current && vlistRef.current.findEndIndex() + 20 > results.length && !fetching.current) {
            void fetchItems(false);
        }
    }

    async function fetchItems(fresh: boolean) {
        fetching.current = true;
        transactionId.current++;
        const id = transactionId.current;

        const res = await native.mpm.searchAddons(scope.current, query.current, gameId, fresh ? null : paginationRef.current);

        paginationRef.current = res.pagination;

        if (id === transactionId.current) {
            setResults(fresh ? res.contents : uniqueBy(results.concat(res.contents), r => r.id));
            fetching.current = false;
        }
    }

    const tabTitles = [
        ["mods", <BlocksIcon/>],
        ["resourcepacks", <ImagesIcon/>],
        ["shaderpacks", <SunIcon/>]
    ] as const;

    return <div className="flex flex-col h-full gap-2">
        <div className="flex gap-2 items-center">
            <Tabs onSelectionChange={handleScopeChange}>
                {
                    tabTitles.map(([k, icon]) =>
                        <Tab
                            key={k}
                            title={
                                <div className="flex items-center gap-2">
                                    {icon}
                                    {t(`type.${k}`)}
                                </div>
                            }
                        />
                    )
                }
            </Tabs>

            <Input startContent={<SearchIcon/>} onValueChange={handleQueryChange}/>
        </div>
        <VList ref={vlistRef} onScroll={onScroll} className="pr-2">
            {
                results.map(r => <AddonMetaDisplay key={r.id} gameId={gameId} meta={r}/>)
            }
        </VList>
    </div>;
}
