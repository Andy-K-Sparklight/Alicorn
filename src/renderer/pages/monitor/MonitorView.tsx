import { Tab, Tabs } from "@heroui/react";
import { GameProcessProvider, useCurrentProc } from "@pages/monitor/GameProcessProvider";
import { LogsDisplay } from "@pages/monitor/LogsDisplay";
import { MonitorActionsMemo } from "@pages/monitor/MonitorActions";
import { PerformanceDisplay } from "@pages/monitor/PerformanceDisplay";
import { StatusDisplayMemo } from "@pages/monitor/StatusDisplay";
import { CpuIcon, FileClockIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "wouter";

export function MonitorView() {
    const { procId } = useParams<{ procId: string }>();
    return <Monitor procId={procId} key={procId}/>;
}

function Monitor({ procId }: { procId: string }) {
    return <GameProcessProvider procId={procId}>
        <div className="w-full h-full flex gap-4 mx-auto">
            <div className="basis-1/4">
                <ControlPanel/>
            </div>
            <div className="grow flex flex-col">
                <ContentArea/>
            </div>
        </div>
    </GameProcessProvider>;
}

function ContentArea() {
    const { t } = useTranslation("pages", { keyPrefix: "monitor" });

    return <Tabs radius="full">
        <Tab
            className="h-full"
            key="logs"
            title={
                <div className="flex gap-1 items-center">
                    <FileClockIcon/>
                    {t("log-view")}
                </div>
            }
        >
            <LogsDisplay/>
        </Tab>
        <Tab
            className="h-full"
            key="stats"
            title={
                <div className="flex gap-1 items-center">
                    <CpuIcon/>
                    {t("perf-view")}
                </div>
            }
        >
            <PerformanceDisplay/>
        </Tab>
    </Tabs>;
}

function ControlPanel() {
    const proc = useCurrentProc();
    const { profile: { id, name, type }, status, startTime, pid, exitTime } = proc;
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const t = window.setInterval(() => setTime(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    return <div className="w-full h-full flex flex-col gap-4">
        <div className="grow">
            <StatusDisplayMemo
                id={id}
                name={name}
                type={type}
                status={status}
                uptime={(exitTime ?? time) - startTime}
                pid={pid}
            />
        </div>
        <MonitorActionsMemo procId={proc.id} gameId={id} status={status}/>
    </div>;
}
