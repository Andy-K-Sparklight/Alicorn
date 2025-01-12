import { Divider } from "@nextui-org/react";
import { MultilineTextEntry, NumberSliderEntry, OnOffEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { CodeIcon, MoveToBottomIcon, UnfoldIcon } from "@primer/octicons-react";
import React, { FC } from "react";

/**
 * Network configuration page.
 */
export const NetworkTab: FC = () => {
    const [config, makeReduce] = useConfig();

    if (!config) return;

    return <>
        <OnOffEntry
            icon={MoveToBottomIcon}
            id="aria2"
            value={config.net.downloader === "aria2"}
            onChange={makeReduce((c, isAria2) => c.net.downloader = isAria2 ? "aria2" : "nextdl")}
        />

        <Divider/>

        {
            config.net.downloader === "aria2" &&
            <>
                <NumberSliderEntry
                    icon={UnfoldIcon}
                    id="aria2-concurrency"
                    value={config.net.aria2.concurrency}
                    max={32}
                    min={1}
                    onChange={makeReduce((c, a) => c.net.aria2.concurrency = a > 1 ? a : 1)}
                />

                <Divider/>

                <MultilineTextEntry
                    icon={CodeIcon}
                    id="aria2-args"
                    value={config.net.aria2.args}
                    onChange={makeReduce((c, a) => c.net.aria2.args = a)}
                />

                <Divider/>
            </>
        }

        <NumberSliderEntry
            icon={UnfoldIcon}
            id="nextdl-concurrency"
            value={config.net.next.concurrency}
            max={64}
            min={1}
            onChange={makeReduce((c, a) => c.net.next.concurrency = a > 1 ? a : 1)}
        />
    </>;
};