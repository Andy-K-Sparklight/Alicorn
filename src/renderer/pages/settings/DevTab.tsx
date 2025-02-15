import { useConfig } from "@/renderer/services/conf";
import { Alert } from "@components/Alert";
import { Divider } from "@heroui/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { AppWindowIcon, SearchCodeIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function DevTab() {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const { config, alterConfig } = useConfig();

    if (!config) return null;

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
            onChange={v => alterConfig(c => c.dev.devTools = v)}
        />

        <Divider/>

        <OnOffEntry
            icon={AppWindowIcon}
            id="dev.frame"
            value={config.dev.showFrame}
            onChange={v => alterConfig(c => c.dev.showFrame = v)}
        />
    </>;
}
