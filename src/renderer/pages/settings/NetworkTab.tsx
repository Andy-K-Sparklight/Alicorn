import { Divider } from "@nextui-org/react";
import { MultilineTextEntry, NumberSliderEntry, OnOffEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { CodeIcon, FileDiffIcon, GitBranchIcon, MoveToBottomIcon, UnfoldIcon } from "@primer/octicons-react";
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
            id="validate"
            value={config.net.validate}
            onChange={makeReduce((c, v) => c.net.validate = v)}
        />

        <Divider/>

        <NumberSliderEntry
            icon={UnfoldIcon}
            id="concurrency"
            value={config.net.concurrency}
            max={32}
            min={1}
            onChange={makeReduce((c, a) => c.net.concurrency = a > 1 ? a : 1)}
        />

        <Divider/>

        <OnOffEntry
            icon={GitBranchIcon}
            id="mirror"
            value={config.net.mirror.enable}
            onChange={makeReduce((c, e) => c.net.mirror.enable = e)}
        />

        <Divider/>

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


                <MultilineTextEntry
                    icon={CodeIcon}
                    id="aria2-args"
                    value={config.net.aria2.args}
                    onChange={makeReduce((c, a) => c.net.aria2.args = a)}
                />

                <Divider/>
            </>
        }
    </>;
};