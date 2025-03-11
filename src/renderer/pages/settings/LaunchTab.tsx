import { useConfig } from "@/renderer/services/conf";
import { Divider } from "@heroui/react";
import { StringArrayEntry } from "@pages/settings/SettingsEntry";
import { TerminalIcon } from "lucide-react";

export function LaunchTab() {
    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return <>
        <StringArrayEntry
            icon={TerminalIcon}
            id="launch.jvm-args"
            value={config.runtime.args.vm}
            onChange={v => alterConfig(c => c.runtime.args.vm = v)}
        />

        <Divider/>

        <StringArrayEntry
            icon={TerminalIcon}
            id="launch.game-args"
            value={config.runtime.args.game}
            onChange={v => alterConfig(c => c.runtime.args.game = v)}
        />
    </>;
}
