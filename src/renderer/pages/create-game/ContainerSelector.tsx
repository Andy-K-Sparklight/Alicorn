import { useGameList } from "@/renderer/services/game";
import { Select, SelectItem, type SharedSelection } from "@heroui/react";
import { useTranslation } from "react-i18next";

interface ContainerSelectorProps {
    enabled: boolean;
    containerId?: string;
    onChange: (containerId?: string) => void;
}

export function ContainerSelector({ enabled, containerId, onChange }: ContainerSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });

    const games = useGameList() ?? [];

    const sid = games.find(g => g.launchHint.containerId === containerId)?.id;

    function handleSelectionChange(s: SharedSelection) {
        if (s instanceof Set) {
            const gid = [...s][0];
            if (!gid) {
                onChange(undefined);
            } else {
                onChange(games.find(g => g.id === gid)?.launchHint.containerId);
            }
        }
    }

    return <Select
        isDisabled={!enabled}
        label={t("container-select-title")}
        placeholder={t("version-select-placeholder")}
        selectedKeys={sid ? [sid] : []}
        onSelectionChange={handleSelectionChange}
    >
        {games.map(g => <SelectItem key={g.id}>{g.name}</SelectItem>)}
    </Select>;
}
