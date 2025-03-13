import { useConfig } from "@/renderer/services/conf";
import { Alert } from "@components/display/Alert";
import { Divider } from "@heroui/react";
import { DirEntry } from "@pages/settings/SettingsEntry";
import { HardDriveIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function StorageTab() {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return <>
        <Alert
            classNames={{ title: "font-bold" }}
            color="warning"
            title={t("store-warn")}
        />

        <DirEntry
            icon={HardDriveIcon}
            id="store.store-path"
            value={config.paths.store}
            onChange={v => alterConfig(c => c.paths.store = v)}
        />

        <Divider/>

        <DirEntry
            icon={HardDriveIcon}
            id="store.game-path"
            value={config.paths.game}
            onChange={v => alterConfig(c => c.paths.game = v)}
        />

        <Divider/>

        <DirEntry
            icon={HardDriveIcon}
            id="store.temp-path"
            value={config.paths.temp}
            onChange={v => alterConfig(c => c.paths.temp = v)}
        />
    </>;
}
