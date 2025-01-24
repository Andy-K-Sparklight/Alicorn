import { Divider } from "@heroui/react";
import { NumberSliderEntry, OnOffEntry, StringArrayEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { ArrowLeftRightIcon, DatabaseBackupIcon, DownloadIcon, FileDiffIcon, TerminalIcon } from "lucide-react";
import React, { FC } from "react";

/**
 * Network configuration page.
 */
export const NetworkTab: FC = () => {
    const [config, makeReduce] = useConfig();

    if (!config) return;

    return <>
        <OnOffEntry
            icon={FileDiffIcon}
            id="network.validate"
            value={config.net.validate}
            onChange={makeReduce((c, v) => c.net.validate = v)}
        />

        <Divider/>

        <NumberSliderEntry
            icon={ArrowLeftRightIcon}
            id="network.concurrency"
            value={config.net.concurrency}
            max={32}
            min={1}
            onChange={makeReduce((c, a) => c.net.concurrency = a > 1 ? a : 1)}
        />

        <Divider/>

        <OnOffEntry
            icon={DatabaseBackupIcon}
            id="network.mirror"
            value={config.net.mirror.enable}
            onChange={makeReduce((c, e) => c.net.mirror.enable = e)}
        />

        <Divider/>

        <OnOffEntry
            icon={DownloadIcon}
            id="network.aria2"
            value={config.net.downloader === "aria2"}
            onChange={makeReduce((c, isAria2) => c.net.downloader = isAria2 ? "aria2" : "nextdl")}
        />


        {
            config.net.downloader === "aria2" &&
            <>
                <Divider/>

                <StringArrayEntry
                    icon={TerminalIcon}
                    id="network.aria2-args"
                    value={config.net.aria2.args}
                    onChange={makeReduce((c, a) => c.net.aria2.args = a)}
                />
            </>
        }
    </>;
};
