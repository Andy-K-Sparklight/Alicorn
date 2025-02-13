import { Alert } from "@components/Alert";
import { useConfig } from "@components/ConfigProvider";
import { Divider } from "@heroui/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { AppWindowIcon, SearchCodeIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function DevTab() {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const [config, makeReduce] = useConfig();


    return <>
        <Alert
            classNames={{ title: "font-bold" }}
            color="danger"
            title={t("dev-warn")}
        />

        <OnOffEntry
            icon={SearchCodeIcon}
            id="dev.devtools"
            value={config.dev.devTools}
            onChange={makeReduce((c, d) => c.dev.devTools = d)}
        />

        <Divider/>

        <OnOffEntry
            icon={AppWindowIcon}
            id="dev.frame"
            value={config.dev.showFrame}
            onChange={makeReduce((c, s) => c.dev.showFrame = s)}
        />
    </>;
}
