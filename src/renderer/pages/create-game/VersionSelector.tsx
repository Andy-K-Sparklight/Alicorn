import type { VersionEntry } from "@/main/install/vanilla";
import { useVersionManifest } from "@/renderer/services/sources";
import { GameTypeImage } from "@components/GameTypeImage";
import { Checkbox, Select, SelectItem, type SharedSelection, Spinner } from "@heroui/react";
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

    function handleSelectionChange(sel: SharedSelection) {
        if (sel instanceof Set) {
            const s = [...sel];
            onChange(s[0]?.toString()); // Might be null when no selection
        }
    }

    return <div className="items-center flex gap-4">
        <div className="grow">
            <Select
                isVirtualized
                aria-label="Select Version"
                selectedKeys={version ? [version] : []}
                placeholder={t("version-select-placeholder")}
                onSelectionChange={handleSelectionChange}
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
                        <SelectItem key={v.id} textValue={v.id}>
                            <VersionContent version={v}/>
                        </SelectItem>
                    )
                }
            </Select>
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
        <div className="h-full rounded-full bg-content2 p-2">
            <GameTypeImage type={gameType}/>
        </div>

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
        <Spinner size="sm"/>
        <span className="text-foreground-400">
            {t("loading-versions")}
        </span>
    </div>;
}
