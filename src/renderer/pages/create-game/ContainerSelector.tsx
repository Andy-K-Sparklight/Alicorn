import { useGameList } from "@/renderer/store/games";
import { Select, SelectItem, type SharedSelection } from "@heroui/react";
import { useTranslation } from "react-i18next";

interface ContainerSelectorProps {
    containerId?: string;
    onChange: (containerId?: string) => void;
}

export function ContainerSelector({ containerId, onChange }: ContainerSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });

    const games = useGameList();

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
        label={t("container-select-title")}
        placeholder={t("version-select-placeholder")}
        selectedKeys={sid ? [sid] : []}
        onSelectionChange={handleSelectionChange}
    >
        {
            games.map(g =>
                <SelectItem key={g.id} textValue={g.id}>
                    <div className="flex items-center gap-2">
                        <div>{g.name}</div>
                        <div className="text-foreground-400 text-sm">{g.id}</div>
                    </div>
                </SelectItem>
            )
        }
    </Select>;
}
