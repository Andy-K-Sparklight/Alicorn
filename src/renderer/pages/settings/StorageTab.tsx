import { Alert, Divider } from "@heroui/react";
import { DirEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { ArchiveIcon } from "@primer/octicons-react";
import React, { type FC } from "react";
import { useTranslation } from "react-i18next";

export const StorageTab: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const [config, makeReduce] = useConfig();

    if (!config) return;

    return <>
        <Alert
            classNames={{ title: "font-bold" }}
            color="warning"
            title={t("store-warn")}
            description=""
        />

        <DirEntry
            icon={ArchiveIcon}
            id="store-path"
            value={config.paths.store}
            onChange={makeReduce((c, pt) => c.paths.store = pt)}
        />

        <Divider/>

        <DirEntry
            icon={ArchiveIcon}
            id="game-path"
            value={config.paths.game}
            onChange={makeReduce((c, pt) => c.paths.game = pt)}
        />
    </>;
};