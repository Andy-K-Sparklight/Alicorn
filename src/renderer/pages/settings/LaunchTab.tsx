import { Divider } from "@heroui/react";
import { MultilineTextEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { CodeIcon } from "@primer/octicons-react";
import { FC } from "react";

export const LaunchTab: FC = () => {
    const [config, makeReduce] = useConfig();

    if (!config) return;

    return <>
        <MultilineTextEntry
            icon={CodeIcon}
            id="launch.jvm-args"
            value={config.runtime.args.vm}
            onChange={makeReduce((c, a) => c.runtime.args.vm = a)}
        />

        <Divider/>

        <MultilineTextEntry
            icon={CodeIcon}
            id="launch.game-args"
            value={config.runtime.args.game}
            onChange={makeReduce((c, a) => c.runtime.args.game = a)}
        />

        <Divider/>
    </>;
};
