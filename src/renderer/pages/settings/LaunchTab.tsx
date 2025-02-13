import { useConfig } from "@components/ConfigProvider";
import { Divider } from "@heroui/react";
import { StringArrayEntry } from "@pages/settings/SettingsEntry";
import { TerminalIcon } from "lucide-react";

export function LaunchTab() {
    const [config, makeReduce] = useConfig();

    return <>
        <StringArrayEntry
            icon={TerminalIcon}
            id="launch.jvm-args"
            value={config.runtime.args.vm}
            onChange={makeReduce((c, a) => c.runtime.args.vm = a)}
        />

        <Divider/>

        <StringArrayEntry
            icon={TerminalIcon}
            id="launch.game-args"
            value={config.runtime.args.game}
            onChange={makeReduce((c, a) => c.runtime.args.game = a)}
        />

        <Divider/>
    </>;
}
