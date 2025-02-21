import { useConfig } from "@/renderer/services/conf";
import { Divider } from "@heroui/react";
import { NumberSliderEntry, OnOffEntry } from "@pages/settings/SettingsEntry";
import { ArrowLeftRightIcon, DatabaseBackupIcon, FileDiffIcon, ZapIcon } from "lucide-react";
import React from "react";

/**
 * Network configuration page.
 */
export function NetworkTab() {
    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return <>
        <OnOffEntry
            icon={FileDiffIcon}
            id="network.validate"
            value={config.net.validate}
            onChange={v => alterConfig(c => c.net.validate = v)}
        />

        <Divider/>

        <OnOffEntry
            icon={ZapIcon}
            id="network.aria2"
            value={config.net.allowAria2}
            onChange={v => alterConfig(c => c.net.allowAria2 = v)}
        />

        <Divider/>

        <NumberSliderEntry
            icon={ArrowLeftRightIcon}
            id="network.concurrency"
            value={config.net.concurrency}
            max={128}
            min={4}
            onChange={v => alterConfig(c => c.net.concurrency = v)}
        />

        <Divider/>

        <OnOffEntry
            icon={DatabaseBackupIcon}
            id="network.mirror"
            value={config.net.mirror.enable}
            onChange={v => alterConfig(c => c.net.mirror.enable = v)}
        />
    </>;
}
