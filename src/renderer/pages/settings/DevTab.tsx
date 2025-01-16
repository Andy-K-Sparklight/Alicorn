import { Alert } from "@nextui-org/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { CodescanIcon } from "@primer/octicons-react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

export const DevTab: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const [config, makeReduce] = useConfig();

    if (!config) return;

    return <>
        <Alert
            color="danger"
            title={t("dev-warn")}
            description=""
        />

        <OnOffEntry
            icon={CodescanIcon}
            id="devtools"
            value={config.dev.devTools}
            onChange={makeReduce((c, d) => c.dev.devTools = d)}
        />
    </>;
};