import { Separator } from "@heroui/react";
import { OnOffEntry, StringArrayEntry } from "@pages/settings/SettingsEntry";
import { GaugeIcon, TerminalIcon } from "lucide-react";
import { useConfig } from "@/renderer/services/conf";

export function LaunchTab() {
    const { config, alterConfig } = useConfig();

    if (!config) return null;

    return (
        <>
            <OnOffEntry
                icon={GaugeIcon}
                id="launch.readyboom"
                value={config.runtime.readyboom}
                onChange={v => alterConfig(c => (c.runtime.readyboom = v))}
            />

            <Separator />

            <StringArrayEntry
                icon={TerminalIcon}
                id="launch.jvm-args"
                value={config.runtime.args.vm}
                onChange={v => alterConfig(c => (c.runtime.args.vm = v))}
            />

            <Separator />

            <StringArrayEntry
                icon={TerminalIcon}
                id="launch.game-args"
                value={config.runtime.args.game}
                onChange={v => alterConfig(c => (c.runtime.args.game = v))}
            />
        </>
    );
}
