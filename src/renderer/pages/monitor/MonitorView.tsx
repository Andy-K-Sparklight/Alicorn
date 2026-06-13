import type { PropsWithParams } from "@components/misc/AnimatedRoute";
import { Tabs } from "@heroui/react";
import { GameProcessProvider, useCurrentProc } from "@pages/monitor/GameProcessProvider";
import { LogsDisplay } from "@pages/monitor/LogsDisplay";
import { MonitorActionsMemo } from "@pages/monitor/MonitorActions";
import { PerformanceDisplay } from "@pages/monitor/PerformanceDisplay";
import { StatusDisplayMemo } from "@pages/monitor/StatusDisplay";
import { CpuIcon, FileClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function MonitorView({ params: { procId } }: PropsWithParams<{ procId: string }>) {
    return <Monitor procId={procId} key={procId} />;
}

function Monitor({ procId }: { procId: string }) {
    return (
        <GameProcessProvider procId={procId}>
            <div className="w-full h-full flex gap-4 mx-auto">
                <div className="basis-1/4">
                    <ControlPanel />
                </div>
                <div className="grow flex flex-col">
                    <ContentArea />
                </div>
            </div>
        </GameProcessProvider>
    );
}

function ContentArea() {
    const { t } = useTranslation("pages", { keyPrefix: "monitor" });

    return (
        <Tabs className="h-full">
            <Tabs.ListContainer>
                <Tabs.List>
                    <Tabs.Tab id="logs">
                        <FileClockIcon />
                        {t("log-view")}
                        <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="stats">
                        <CpuIcon />
                        {t("perf-view")}
                        <Tabs.Indicator />
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="logs" className="h-full">
                <LogsDisplay />
            </Tabs.Panel>
            <Tabs.Panel id="stats" className="h-full">
                <PerformanceDisplay />
            </Tabs.Panel>
        </Tabs>
    );
}

function ControlPanel() {
    const proc = useCurrentProc();
    const {
        profile: {
            id,
            name,
            type,
            launchHint: { profileId },
        },
        status,
        startTime,
        pid,
        exitTime,
    } = proc;
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const t = window.setInterval(() => setTime(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="grow">
                <StatusDisplayMemo
                    id={id}
                    name={name}
                    profileId={profileId}
                    type={type}
                    status={status}
                    uptime={(exitTime ?? time) - startTime}
                    pid={pid}
                />
            </div>
            <MonitorActionsMemo procId={proc.id} gameId={id} status={status} />
        </div>
    );
}
