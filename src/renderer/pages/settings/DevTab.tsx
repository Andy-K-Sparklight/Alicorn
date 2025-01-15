import { Alert, Button } from "@nextui-org/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { CodescanIcon } from "@primer/octicons-react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

const DO_NOT_OPEN_DEV_MODE_URL = "https://www.electronjs.org/docs/latest/tutorial/security";

export const DevTab: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    const [config, makeReduce] = useConfig();

    if (!config) return;

    function whyNotDevMode() {
        native.ext.openURL(DO_NOT_OPEN_DEV_MODE_URL);
    }

    return <>
        <Alert
            color="danger"
            title={t("dev-warn")}
            description=""
            endContent={
                <Button onPress={whyNotDevMode} color="danger">{t("dev-warn-more")}</Button>
            }
        />

        <OnOffEntry
            icon={CodescanIcon}
            id="devtools"
            value={config.dev.devTools}
            onChange={makeReduce((c, d) => c.dev.devTools = d)}
        />
    </>;
};