import type { GameCoreType } from "@/main/game/spec";
import type { GameProcessLog } from "@/main/launch/log-parser";
import { type RemoteGameProcess, type RemoteGameStatus, useGameProcDetail } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { ConfirmPopup } from "@components/ConfirmPopup";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Card, CardBody, Link, Tab, Tabs } from "@heroui/react";
import { MemoryUsageChart } from "@pages/monitor/MemoryUsageChart";
import { clsx } from "clsx";
import { ArrowLeftIcon, CpuIcon, FileClockIcon, FolderArchiveIcon, FolderIcon, OctagonXIcon } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { VList, type VListHandle } from "virtua";
import { useParams } from "wouter";

export function MonitorView() {
    const { procId } = useParams<{ procId: string }>();
    return <Monitor procId={procId} key={procId}/>;
}

const GameProcessContext = React.createContext<RemoteGameProcess | null>(null);

function Monitor({ procId }: { procId: string }) {
    const proc = useGameProcDetail(procId);

    return <GameProcessContext.Provider value={proc}>
        <div className="w-full h-full flex gap-4 mx-auto">
            <div className="basis-1/4">
                <ControlPanel/>
            </div>
            <div className="grow flex flex-col">
                <ContentArea/>
            </div>
        </div>
    </GameProcessContext.Provider>;
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

function LogsDisplay() {
    const autoScroll = useRef(true);
    const prevOffset = useRef(0);
    const ref = useRef<VListHandle | null>(null);
    const { id: procId, logs } = useContext(GameProcessContext)!;

    function scrollToBottom() {
        ref.current?.scrollToIndex(Number.MAX_SAFE_INTEGER, { smooth: true });
    }

    useEffect(() => {
        if (autoScroll.current) {
            scrollToBottom();
        }
    }, [logs]);

    function updateAutoScroll(offset: number) {
        if (ref.current) {
            if (offset < prevOffset.current) {
                // Cancel auto scroll when scrolling up
                autoScroll.current = false;
                return;
            } else if (ref.current.scrollOffset - ref.current.scrollSize + ref.current.viewportSize >= -10) {
                // Enable auto scroll when not scrolling up & reached the bottom
                // But does not cancel it if not at the bottom (due to smooth scrolling)
                autoScroll.current = true;
            }

            prevOffset.current = offset;
        }
    }

    return <VList
        ref={ref}
        className="h-full p-2"
        onScroll={updateAutoScroll}
        onScrollEnd={() => {
            // Prevent misjudged scroll up when layout shifts
            prevOffset.current = 0;
        }}
    >
        {
            logs.map(log =>
                // The key includes process ID to correctly handle props changes when switching between monitors
                <LogLineMemo log={log} key={procId + ":" + log.index}/>
            )
        }
    </VList>;
}

const EXPLAIN_MEMORY_URL = "https://stackoverflow.com/a/5406063";

function PerformanceDisplay() {
    const { memUsage } = useContext(GameProcessContext)!;
    const { t } = useTranslation("pages", { keyPrefix: "monitor.memory" });

    function handleExplainMemory() {
        native.ext.openURL(EXPLAIN_MEMORY_URL);
    }

    return <div className="w-full h-full flex flex-col gap-4 p-4">
        <div className="basis-1/2 flex flex-col gap-4">
            <div className="text-xl font-bold">{t("title")}</div>
            <div className="text-foreground-400 text-sm">
                {t("sub")}
                <Link onPress={handleExplainMemory} className="text-sm">{t("sub-link")}</Link>
            </div>
            <MemoryUsageChart stat={memUsage}/>
        </div>
    </div>;
}

const LogLineMemo = React.memo(LogLine, (prevProps, nextProps) => {
    // Log objects are not changed once parsed
    // By comparing props via index we save lots of re-renders
    return nextProps.log.index === prevProps.log.index;
});

function LogLine({ log }: { log: GameProcessLog }) {
    const { time, level, message, throwable } = log;

    return <div className="flex flex-col">
        <div className="flex gap-3">
            <div className="text-foreground-400">
                {new Date(time).toLocaleTimeString()}
            </div>
            <div
                className={
                    clsx("break-all", {
                        "font-bold text-danger": level === "FATAL" || level === "ERROR",
                        "font-bold text-warning": level === "WARN",
                        "text-foreground-400": level === "DEBUG"
                    })
                }
            >
                {message}
                <pre className="whitespace-pre-wrap">{throwable}</pre>
            </div>
        </div>
    </div>;
}

function ControlPanel() {
    const proc = useContext(GameProcessContext)!;
    const { profile: { id, name, type }, status, startTime, pid, exitTime, id: procId } = proc;
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const t = window.setInterval(() => setTime(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    return <div className="w-full h-full flex flex-col gap-4">
        <div className="grow">
            <GameInfoCardMemo
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

interface GameInfoCardProps {
    id: string;
    name: string;
    type: GameCoreType;
    status: RemoteGameStatus;
    uptime: number;
    pid: number;
}

const GameInfoCardMemo = React.memo(GameInfoCard);

function GameInfoCard({ id, name, type, status, uptime, pid }: GameInfoCardProps) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor" });

    return <Card className="h-full">
        <CardBody>
            <div className="flex flex-col p-4 gap-6 items-center my-auto">
                <div
                    className={
                        clsx("max-w-40 mx-10 p-5 bg-content2 rounded-full outline outline-4 outline-offset-8", {
                            "outline-success": status === "running",
                            "outline-default": status === "exited",
                            "outline-danger": status === "crashed"
                        })
                    }
                >
                    <GameTypeImage type={type}/>
                </div>


                <div className="mt-2 flex flex-col items-center gap-1">
                    <div className="font-bold text-lg">{name}</div>
                    <div className="text-default-400">{id}</div>
                </div>


                <div className="flex flex-col w-5/6 gap-1">
                    <div className="flex text-sm">
                        <div className="grow text-foreground-400">{t("label.status")}</div>
                        <div>{t(`status.${status}`)}</div>
                    </div>
                    <div className="flex text-sm">
                        <div className="grow text-foreground-400">{t("label.uptime")}</div>
                        <div>{formatTime(uptime)}</div>
                    </div>
                    <div className="flex text-sm">
                        <div className="grow text-foreground-400">{t("label.pid")}</div>
                        <div>{pid}</div>
                    </div>
                </div>
            </div>
        </CardBody>
    </Card>;
}

interface MonitorActionsProps {
    procId: string;
    gameId: string;
    status: RemoteGameStatus;
}

const MonitorActionsMemo = React.memo(MonitorActions);

function MonitorActions({ procId, gameId, status }: MonitorActionsProps) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor.actions" });
    const nav = useNav();

    function handleStopAction() {
        native.launcher.stop(procId);
    }

    const stopDisabled = status !== "running";

    return <div className="flex flex-col gap-4">
        <Button startContent={<ArrowLeftIcon/>} onPress={() => nav("/monitor")}>
            {t("back-to-list")}
        </Button>
        <Button startContent={<FolderIcon/>} onPress={() => native.game.reveal(gameId, ".")}>
            {t("reveal-root")}
        </Button>
        <Button startContent={<FolderArchiveIcon/>} onPress={() => native.game.reveal(gameId, "resourcepacks")}>
            {t("reveal-rsp")}
        </Button>
        <ConfirmPopup
            placement="top"
            title={t("stop-title")}
            sub={t("stop-sub")}
            btnText={t("stop-confirm")}
            onConfirm={handleStopAction}
            color="danger"
        >
            <Button
                isDisabled={stopDisabled}
                color="danger"
                startContent={<OctagonXIcon/>}
            >
                {t("stop")}
            </Button>
        </ConfirmPopup>
    </div>;
}

function formatTime(ms: number) {
    const sec = Math.round(ms / 1000);
    const hrs = Math.floor(sec / 3600);
    const min = Math.floor((sec % 3600) / 60);
    const rs = sec % 60;

    const hh = hrs.toString().padStart(2, "0");
    const mm = min.toString().padStart(2, "0");
    const ss = rs.toString().padStart(2, "0");

    return `${hh}:${mm}:${ss}`;
}
