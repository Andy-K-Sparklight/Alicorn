import { GameTypeIcon } from "@components/display/GameTypeIcon";
import { Checkbox, ComboBox, Input, Label, ListBox, Spinner } from "@heroui/react";
import { DotIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { VersionEntry } from "@/main/install/vanilla";
import { useVersionManifest } from "@/renderer/services/sources";

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

    if (!vm) return <VersionLoading />;

    let versions = vm.versions;

    if (!showSnapshots) {
        versions = vm.versions.filter(v => v.type !== "snapshot");
    }

    function handleSelectionChange(k: string | number | null) {
        onChange(k?.toString() ?? undefined);
    }

    return (
        <div className="items-center flex gap-4">
            <div className="grow">
                <ComboBox selectedKey={version || null} onSelectionChange={handleSelectionChange}>
                    <Label className="sr-only">Select Version</Label>
                    <ComboBox.InputGroup>
                        <Input placeholder={t("version-select-placeholder")} />
                        <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                        <ListBox renderEmptyState={() => t("version-select-empty")}>
                            {versions.map(v => (
                                <ListBox.Item key={v.id} id={v.id} textValue={v.id}>
                                    <VersionContent version={v} />
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </ComboBox.Popover>
                </ComboBox>
            </div>

            <div>
                <Checkbox
                    id="include-snapshots"
                    isSelected={showSnapshots}
                    onChange={setShowSnapshots}
                >
                    <Checkbox.Control>
                        <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                        <Label htmlFor="include-snapshots">{t("include-snapshots")}</Label>
                    </Checkbox.Content>
                </Checkbox>
            </div>
        </div>
    );
}

function VersionContent({ version: { id, type, sha1, releaseTime } }: { version: VersionEntry }) {
    const gameType =
        (
            {
                release: "vanilla-release",
                snapshot: "vanilla-snapshot",
                old_alpha: "vanilla-old-alpha",
                old_beta: "vanilla-old-beta",
            } as const
        )[type] ?? "unknown";

    return (
        <div className="flex h-[64px] items-center gap-4 py-2">
            <GameTypeIcon className="h-full" gameType={gameType} />

            <div className="flex flex-col">
                <div className="font-bold text-lg">{id}</div>
                <div className="flex items-center text-muted text-sm">
                    {sha1}
                    <DotIcon />
                    {new Date(releaseTime).toLocaleString()}
                </div>
            </div>
        </div>
    );
}

function VersionLoading() {
    const t = useTrans();

    return (
        <div className="flex gap-4 justify-center items-center">
            <Spinner size="sm" />
            <span className="text-muted">{t("loading-versions")}</span>
        </div>
    );
}
