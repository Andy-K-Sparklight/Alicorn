import { Alert } from "@components/Alert";
import { useConfig } from "@components/ConfigProvider";
import { Divider } from "@heroui/react";
import { DirEntry } from "@pages/settings/SettingsEntry";
import { HardDriveIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function StorageTab() {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const [config, makeReduce] = useConfig();

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
            onChange={makeReduce((c, pt) => c.paths.store = pt)}
        />

        <Divider/>

        <DirEntry
            icon={HardDriveIcon}
            id="store.game-path"
            value={config.paths.game}
            onChange={makeReduce((c, pt) => c.paths.game = pt)}
        />

        <Divider/>

        <DirEntry
            icon={HardDriveIcon}
            id="store.temp-path"
            value={config.paths.temp}
            onChange={makeReduce((c, pt) => c.paths.temp = pt)}
        />
    </>;
}
