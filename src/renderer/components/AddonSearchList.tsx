import type { MpmAddonMeta, MpmAddonType } from "@/main/mpm/spec";
import { uniqueBy } from "@/main/util/misc";
import { AddonMetaDisplay } from "@components/AddonMetaDisplay";
import { Input, Tab, Tabs } from "@heroui/react";
import { BlocksIcon, ImagesIcon, SearchIcon, SunIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStorage } from "react-use";
import { VList, type VListHandle } from "virtua";

interface AddonSearchListProps {
    gameId: string;
}

export function AddonSearchList({ gameId }: AddonSearchListProps) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.addons" });
    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<MpmAddonType>("mods");
    const transactionId = useRef(0);
    const fetching = useRef(false);
    const paginationRef = useRef<unknown>(null);
    const [results, setResults] = useSessionStorage<MpmAddonMeta[]>(`mod-search-results.${gameId}`, []);
    const vlistRef = useRef<VListHandle | null>(null);
    const searchDelayTimer = useRef<number | null>(null);

    useEffect(() => {
        if (searchDelayTimer.current !== null) {
            window.clearTimeout(searchDelayTimer.current);
        }

        searchDelayTimer.current = window.setTimeout(() => fetchItems(true), 500);
    }, [query, scope]);

    function onScroll() {
        if (vlistRef.current) {
            if (vlistRef.current.findEndIndex() + 20 > results.length && !fetching.current) {
                void fetchItems(false);
            }
        }
    }

    async function fetchItems(fresh: boolean) {
        fetching.current = true;
        transactionId.current++;
        const id = transactionId.current;

        const {
            contents,
            pagination
        } = await native.mpm.searchAddons(scope, query, gameId, fresh ? null : paginationRef.current);

        paginationRef.current = pagination;

        if (id === transactionId.current) {
            setResults(fresh ? contents : uniqueBy(results.concat(contents), r => r.id));
            fetching.current = false;
        }
    }

    return <div className="flex flex-col h-full gap-2">
        <div className="flex gap-2 items-center">
            <Tabs selectedKey={scope} onSelectionChange={s => setScope(s as any)}>
                <Tab
                    key="mods"
                    title={
                        <div className="flex items-center gap-2">
                            <BlocksIcon/>
                            {t("type.mods")}
                        </div>
                    }
                />
                <Tab
                    key="resourcepacks"
                    title={
                        <div className="flex items-center gap-2">
                            <ImagesIcon/>
                            {t("type.resourcepacks")}
                        </div>
                    }
                />
                <Tab
                    key="shaderpacks"
                    title={
                        <div className="flex items-center gap-2">
                            <SunIcon/>
                            {t("type.shaderpacks")}
                        </div>
                    }
                />
            </Tabs>

            <Input startContent={<SearchIcon/>} value={query} onValueChange={setQuery}/>
        </div>
        <VList ref={vlistRef} onScroll={onScroll} className="pr-2">
            {
                results.map(r => <AddonMetaDisplay key={r.id} gameId={gameId} meta={r}/>)
            }
        </VList>
    </div>;
}
