import type { MpmAddonMeta } from "@/main/mpm/spec";

import { useGameProfile } from "@/renderer/store/games";
import { Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VList, type VListHandle } from "virtua";

interface ModSearchListProps {
    gameId: string;
}

export function ModSearchList({ gameId }: ModSearchListProps) {
    const game = useGameProfile(gameId);
    const [query, setQuery] = useState("");
    const transactionId = useRef(0);
    const fetching = useRef(false);
    const [results, setResults] = useState<MpmAddonMeta[]>([]);
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
            setResults(fresh ? res : results.concat(res));
            fetching.current = false;
        }
    }

    return <div className="flex flex-col h-full gap-2">
        <Input startContent={<SearchIcon/>} value={query} onValueChange={setQuery}/>
        <VList ref={vlistRef} onScroll={onScroll} className="pr-2">
            {
                results.map(r => <ModDisplay key={r.id} meta={r}/>)
            }
        </VList>
    </div>;
}

function ModDisplay({ meta }: { meta: MpmAddonMeta }) {
    const { id, vendor, title, author, description, icon } = meta;

    const effectiveIcon = icon || "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

    return <div className="px-4 py-2 rounded-xl bg-content1 w-full flex items-center gap-4 mt-2">
        <div className="h-12 m-1 aspect-square rounded-xl overflow-hidden">
            <img src={effectiveIcon} alt={title} className="w-full h-full object-contain"/>
        </div>

        <div className="flex flex-col overflow-hidden grow">
            <div className="font-bold text-lg">{title}</div>
            <div className="text-sm text-foreground-500">{description}</div>
        </div>

        <div>
            <Button isIconOnly color="primary">
                <PlusIcon/>
            </Button>
        </div>
    </div>;
}
