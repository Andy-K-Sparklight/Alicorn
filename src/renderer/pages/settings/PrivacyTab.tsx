import { Separator } from "@heroui/react";
import { OnOffEntry } from "@pages/settings/SettingsEntry";
import { FileClockIcon, FileHeartIcon, FileLock2Icon, FileX2Icon } from "lucide-react";
import { useConfig } from "@/renderer/services/conf";

export function PrivacyTab() {
    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return (
        <>
            <OnOffEntry
                icon={FileX2Icon}
                id="privacy.crash-report"
                value={config.analytics.crashReports}
                onChange={v => alterConfig(c => (c.analytics.crashReports = v))}
            />

            <Separator />

            <OnOffEntry
                icon={FileClockIcon}
                id="privacy.performance-report"
                value={config.analytics.performanceReports}
                onChange={v => alterConfig(c => (c.analytics.performanceReports = v))}
            />

            <Separator />

            <OnOffEntry
                icon={FileHeartIcon}
                id="privacy.ping"
                value={config.analytics.ping}
                onChange={v => alterConfig(c => (c.analytics.ping = v))}
            />

            <Separator />

            <OnOffEntry
                icon={FileLock2Icon}
                id="privacy.hide-ua"
                value={config.analytics.hideUA}
                onChange={v => alterConfig(c => (c.analytics.hideUA = v))}
            />
        </>
    );
}
