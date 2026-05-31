import { Alert } from "@components/display/Alert";
import { Separator } from "@heroui/react";
import { DirEntry } from "@pages/settings/SettingsEntry";
import { HardDriveIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfig } from "@/renderer/services/conf";

export function StorageTab() {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return (
        <>
            <Alert status="danger" title={t("store-warn")} />

            <DirEntry
                icon={HardDriveIcon}
                id="store.store-path"
                value={config.paths.store}
                onChange={v => alterConfig(c => (c.paths.store = v))}
            />

            <Separator />

            <DirEntry
                icon={HardDriveIcon}
                id="store.game-path"
                value={config.paths.game}
                onChange={v => alterConfig(c => (c.paths.game = v))}
            />

            <Separator />

            <DirEntry
                icon={HardDriveIcon}
                id="store.temp-path"
                value={config.paths.temp}
                onChange={v => alterConfig(c => (c.paths.temp = v))}
            />
        </>
    );
}
