import { AddonMetaDisplay } from "@components/display/AddonMetaDisplay";
import { InputGroup, Spinner, Tabs } from "@heroui/react";
import { BlocksIcon, ImagesIcon, SearchIcon, SunIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStorage } from "react-use";
import { VList, type VListHandle } from "virtua";
import type { MpmAddonMeta, MpmAddonType } from "@/main/mpm/spec";
import { createAddonSearch } from "@/renderer/services/addon-search";

interface AddonSearchListProps {
    gameId: string;
}

export function AddonSearchList({ gameId }: AddonSearchListProps) {
    return <SearchList key={gameId} gameId={gameId} />;
}

function SearchList({ gameId }: AddonSearchListProps) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.addons" });
    const [fetching, setFetching] = useState(false);
    const [results, setResults] = useSessionStorage<MpmAddonMeta[] | null>(
        `mod-search-results.${gameId}`,
        null,
    );
    const vlistRef = useRef<VListHandle | null>(null);

    const [search] = useState(() =>
        createAddonSearch({
            search: (scope, query, pagination) =>
                native.mpm.searchAddons(scope, query, gameId, pagination),
            onResults: setResults,
            onFetching: setFetching,
        }),
    );

    const query = useRef("");
    const scope = useRef<MpmAddonType>("mods");

    useEffect(() => {
        search.refresh();
        return search.cancel;
    }, [search]);

    function handleQueryChange(q: string) {
        query.current = q;
        initiateFreshQuery();
    }

    function handleScopeChange(s: string | number) {
        scope.current = s as MpmAddonType;
        initiateFreshQuery();
    }

    function initiateFreshQuery() {
        search.refresh(scope.current, query.current);
    }

    function onScroll() {
        if (
            vlistRef.current &&
            results &&
            vlistRef.current.findItemIndex(
                vlistRef.current.scrollOffset + vlistRef.current.viewportSize,
            ) +
                20 >
                results.length &&
            !fetching
        ) {
            void search.loadMore();
        }
    }

    const tabTitles = [
        { name: "mods", icon: <BlocksIcon /> },
        { name: "resourcepacks", icon: <ImagesIcon /> },
        { name: "shaderpacks", icon: <SunIcon /> },
    ] as const;

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex gap-2">
                <Tabs onSelectionChange={handleScopeChange}>
                    <Tabs.ListContainer>
                        <Tabs.List>
                            {tabTitles.map(({ name, icon }) => (
                                <Tabs.Tab id={name} key={name}>
                                    <div className="flex items-center gap-2">
                                        {icon}
                                        <span className="break-keep"> {t(`type.${name}`)}</span>
                                    </div>
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>

                <InputGroup fullWidth>
                    <InputGroup.Prefix>
                        <SearchIcon />
                    </InputGroup.Prefix>
                    <InputGroup.Input onChange={e => handleQueryChange(e.target.value)} />
                    {fetching && (
                        <InputGroup.Suffix>
                            <Spinner color="current" size="sm" />
                        </InputGroup.Suffix>
                    )}
                </InputGroup>
            </div>

            {!fetching && results && results.length === 0 ? (
                <div className="grow w-full flex items-center justify-center font-bold text-muted text-lg">
                    {t("no-result")}
                </div>
            ) : (
                <VList ref={vlistRef} onScroll={onScroll} className="pr-2 my-auto">
                    {results?.map(r => (
                        <AddonMetaDisplay key={r.id} gameId={gameId} meta={r} />
                    ))}
                </VList>
            )}
        </div>
    );
}
