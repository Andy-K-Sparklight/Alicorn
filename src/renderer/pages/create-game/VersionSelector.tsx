import type { VersionEntry } from "@/main/install/vanilla";
import { useVersionManifest } from "@/renderer/services/sources";
import { GameTypeIcon } from "@components/GameTypeIcon";
import { Autocomplete, AutocompleteItem, Checkbox, Spinner } from "@heroui/react";
import { DotIcon } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface VersionSelectorProps {
    version?: string;
    onChange: (version?: string) => void;
}

function useTrans() {
    return useTranslation("pages", { keyPrefix: "create-game" }).t;
}

export function VersionSelector({ version, onChange }: VersionSelectorProps) {
    const vm = useVersionManifest();
    const t = useTrans();

    const [showSnapshots, setShowSnapshots] = useState(false);

    if (!vm) return <VersionLoading/>;

    let versions = vm.versions;

    if (!showSnapshots) {
        versions = vm.versions.filter(v => v.type !== "snapshot");
    }

    function handleSelectionChange(k: string | number | null) {
        onChange(k?.toString() ?? undefined);
    }

    return <div className="items-center flex gap-4">
        <div className="grow">
            <Autocomplete
                isVirtualized
                aria-label="Select Version"
                selectedKey={version || null}
                placeholder={t("version-select-placeholder")}
                onSelectionChange={handleSelectionChange}
                listboxProps={{
                    emptyContent: t("version-select-empty")
                }}
                scrollShadowProps={{
                    style: {
                        // @ts-expect-error Non-standard properties
                        "--scroll-shadow-size": "0px"
                    }
                }}
                itemHeight={64}
            >
                {
                    versions.map(v =>
                        <AutocompleteItem key={v.id} textValue={v.id}>
                            <VersionContent version={v}/>
                        </AutocompleteItem>
                    )
                }
            </Autocomplete>
        </div>

        <div>
            <Checkbox checked={showSnapshots} onValueChange={setShowSnapshots}>
                {t("include-snapshots")}
            </Checkbox>
        </div>

    </div>;
}

function VersionContent({ version: { id, type, sha1, releaseTime } }: { version: VersionEntry }) {
    const gameType = ({
        "release": "vanilla-release",
        "snapshot": "vanilla-snapshot",
        "old_alpha": "vanilla-old-alpha",
        "old_beta": "vanilla-old-beta"
    } as const)[type] ?? "unknown";

    return <div className="flex h-[64px] items-center gap-4 py-2">
        <GameTypeIcon className="h-full" gameType={gameType}/>

        <div className="flex flex-col">
            <div className="font-bold text-lg">{id}</div>
            <div className="flex items-center text-foreground-400 text-sm">
                {sha1}
                <DotIcon/>
                {new Date(releaseTime).toLocaleString()}
            </div>
        </div>
    </div>;
}

function VersionLoading() {
    const t = useTrans();

    return <div className="flex gap-4 justify-center items-center">
        <Spinner size="sm" variant="wave"/>
        <span className="text-foreground-400">
            {t("loading-versions")}
        </span>
    </div>;
}
