import { Alert, Divider } from "@heroui/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { BrowserIcon, CodescanIcon } from "@primer/octicons-react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

export const DevTab: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const [config, makeReduce] = useConfig();

    if (!config) return;

    return <>
        <Alert
            classNames={{ title: "font-bold" }}
            color="danger"
            title={t("dev-warn")}
            description=""
        />

        <OnOffEntry
            icon={CodescanIcon}
            id="dev.devtools"
            value={config.dev.devTools}
            onChange={makeReduce((c, d) => c.dev.devTools = d)}
        />

        <Divider/>

        <OnOffEntry
            icon={BrowserIcon}
            id="dev.frame"
            value={config.dev.showFrame}
            onChange={makeReduce((c, s) => c.dev.showFrame = s)}
        />
    </>;
};
