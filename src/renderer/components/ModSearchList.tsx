import type { MpmAddonMeta } from "@/main/mpm/spec";
import { uniqueBy } from "@/main/util/misc";
import { ModMetaDisplay } from "@components/ModMetaDisplay";
import { Input } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSessionStorage } from "react-use";
import { VList, type VListHandle } from "virtua";

interface ModSearchListProps {
    gameId: string;
}

export function ModSearchList({ gameId }: ModSearchListProps) {
    const [query, setQuery] = useState("");
    const transactionId = useRef(0);
    const fetching = useRef(false);
    const [results, setResults] = useSessionStorage<MpmAddonMeta[]>(`mod-search-results.${gameId}`, []);
    const vlistRef = useRef<VListHandle | null>(null);

    useEffect(() => {
        void fetchItems(true);
    }, [query]);

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

        const res = await native.mpm.searchMods(query, gameId, fresh ? 0 : results.length);

        if (id === transactionId.current) {
            setResults(fresh ? res : uniqueBy(results.concat(res), r => r.id));
            fetching.current = false;
        }
    }

    return <div className="flex flex-col h-full gap-2">
        <Input startContent={<SearchIcon/>} value={query} onValueChange={setQuery}/>
        <VList ref={vlistRef} onScroll={onScroll} className="pr-2">
            {
                results.map(r => <ModMetaDisplay key={r.id} gameId={gameId} meta={r}/>)
            }
        </VList>
    </div>;
}
