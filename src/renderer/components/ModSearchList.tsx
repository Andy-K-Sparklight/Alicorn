import type { MpmAddonMeta } from "@/main/mpm/spec";
import { uniqueBy } from "@/main/util/misc";
import { remoteMpm } from "@/renderer/services/mpm";
import { useModInstallStatus } from "@/renderer/store/mpm";
import { Button, Image, Input } from "@heroui/react";
import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { VList, type VListHandle } from "virtua";

interface ModSearchListProps {
    gameId: string;
}

export function ModSearchList({ gameId }: ModSearchListProps) {
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
            setResults(fresh ? res : uniqueBy(results.concat(res), r => r.id));
            fetching.current = false;
        }
    }

    return <div className="flex flex-col h-full gap-2">
        <Input startContent={<SearchIcon/>} value={query} onValueChange={setQuery}/>
        <VList ref={vlistRef} onScroll={onScroll} className="pr-2">
            {
                results.map(r => <ModDisplay key={r.id} gameId={gameId} meta={r}/>)
            }
        </VList>
    </div>;
}

function ModDisplay({ gameId, meta }: { gameId: string, meta: MpmAddonMeta }) {
    const { id, vendor, title, author, description, icon } = meta;
    const installStatus = useModInstallStatus(gameId, id);
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.mods" });

    const effectiveIcon = icon || "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

    function runInstall() {
        if (installStatus !== "not-installed") return;
        void remoteMpm.addMod(gameId, id);
    }

    return <div className="px-4 py-2 rounded-xl bg-content1 w-full flex items-center gap-4 mt-2">
        <div className="h-12 aspect-square m-1 rounded-lg overflow-hidden bg-content2 shrink-0">
            <Image src={effectiveIcon} alt={title}/>
        </div>

        <div className="flex flex-col overflow-hidden grow">
            <div className="font-bold text-lg">{title}</div>
            <div className="text-sm text-foreground-500">{description}</div>
        </div>

        <div className="w-12 shrink-0">
            {
                installStatus === "installed" ?
                    <Button
                        isDisabled
                        isIconOnly
                    >
                        <CheckIcon/>
                    </Button>
                    :
                    <Button
                        isLoading={installStatus === "installing"}
                        isIconOnly
                        color="primary"
                        onPress={runInstall}
                    >
                        <PlusIcon/>
                    </Button>
            }
        </div>
    </div>;
}
