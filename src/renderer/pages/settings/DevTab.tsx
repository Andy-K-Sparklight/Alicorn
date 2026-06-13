import { Alert } from "@components/display/Alert";
import { Separator } from "@heroui/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { AppWindowIcon, SearchCodeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfig } from "@/renderer/services/conf";

export function DevTab() {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return (
        <>
            <Alert status="danger" title={t("dev-warn")} />

            <OnOffEntry
                icon={SearchCodeIcon}
                id="dev.devtools"
                value={config.dev.devTools}
                onChange={v => alterConfig(c => (c.dev.devTools = v))}
            />

            <Separator />

            <OnOffEntry
                icon={AppWindowIcon}
                id="dev.frame"
                value={config.dev.showFrame}
                onChange={v => alterConfig(c => (c.dev.showFrame = v))}
            />
        </>
    );
}
