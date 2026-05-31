import { Label, ListBox, Select } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useGameList } from "@/renderer/services/games";

interface ContainerSelectorProps {
    containerId?: string;
    onChange: (containerId?: string) => void;
}

export function ContainerSelector({ containerId, onChange }: ContainerSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });

    const games = useGameList();

    const sid = games.find(g => g.launchHint.containerId === containerId)?.id;

    function handleSelectionChange(gid: unknown) {
        if (!gid) {
            onChange(undefined);
        } else {
            onChange(games.find(g => g.id === gid)?.launchHint.containerId);
        }
    }

    return (
        <Select
            placeholder={t("version-select-placeholder")}
            value={sid ?? null}
            onChange={handleSelectionChange}
        >
            <Label>{t("container-select-title")}</Label>
            <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {games.map(g => (
                        <ListBox.Item key={g.id} id={g.id} textValue={g.id}>
                            <div className="flex items-center gap-2">
                                {g.name}
                                <span className="text-muted text-sm">{g.id}</span>
                            </div>
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
}
