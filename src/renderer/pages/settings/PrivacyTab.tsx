import { useConfig } from "@components/ConfigProvider";
import { Divider } from "@heroui/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { FileClockIcon, FileHeartIcon, FileX2Icon } from "lucide-react";
import React from "react";

export function PrivacyTab() {
    const [config, makeReduce] = useConfig();

    return <>
        <OnOffEntry
            icon={FileX2Icon}
            id="privacy.crash-report"
            value={config.analytics.crashReports}
            onChange={makeReduce((c, v) => c.analytics.crashReports = v)}
        />

        <Divider/>

        <OnOffEntry
            icon={FileClockIcon}
            id="privacy.performance-report"
            value={config.analytics.performanceReports}
            onChange={makeReduce((c, v) => c.analytics.performanceReports = v)}
        />

        <Divider/>

        <OnOffEntry
            icon={FileHeartIcon}
            id="privacy.ping"
            value={config.analytics.ping}
            onChange={makeReduce((c, v) => c.analytics.ping = v)}
        />
    </>;
}
