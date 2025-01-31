import type { GameProcessLog } from "@/main/launch/log-parser";
import { type RemoteGameProcess, type RemoteGameStatus, useGameProc } from "@/renderer/services/proc";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Card, CardBody, Popover, PopoverContent, PopoverTrigger, Tab, Tabs } from "@heroui/react";
import { clsx } from "clsx";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CircleHelpIcon,
    CpuIcon,
    FileClockIcon,
    FolderArchive,
    OctagonXIcon
} from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { VList, type VListHandle } from "virtua";
import { useLocation, useParams } from "wouter";

export function MonitorView() {
    const { procId } = useParams<{ procId: string }>();
    return <Monitor procId={procId} key={procId}/>;
}

const GameProcessContext = React.createContext<RemoteGameProcess | null>(null);

function Monitor({ procId }: { procId: string }) {
    const proc = useGameProc(procId, 200);

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
    const { detail: { name, modLoader, stable }, status } = proc;

    return <div className="w-full h-full flex flex-col gap-4">
        <div className="grow">
            <GameInfoCardMemo
                name={name}
                modLoader={modLoader}
                stable={stable}
                status={status}
            />
        </div>
        <MonitorActionsMemo procId={proc.id} gameId={proc.detail.id} status={proc.status}/>
    </div>;
}

interface GameInfoCardProps {
    name: string;
    modLoader: string;
    stable: boolean;
    status: RemoteGameStatus;
}

const GameInfoCardMemo = React.memo(GameInfoCard);

function GameInfoCard({ name, modLoader, stable, status }: GameInfoCardProps) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor.status" });

    return <Card className="h-full">
        <CardBody>
            <div className="flex flex-col p-4 gap-2 items-center my-auto">
                <div
                    className={
                        clsx("max-w-40 m-8 p-5 bg-content2 rounded-full outline outline-4 outline-offset-8", {
                            "outline-success": status === "running",
                            "outline-default": status === "exited",
                            "outline-danger": status === "crashed"
                        })
                    }
                >
                    <GameTypeImage loader={modLoader} stable={stable}/>
                </div>
                <div className="font-bold text-2xl">{name}</div>
                <div className="text-lg text-foreground-400">{t(status)}</div>
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
    const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
    const [, nav] = useLocation();

    function handleStopAction() {
        native.launcher.stop(procId);
        setStopConfirmOpen(false);
    }


    const stopDisabled = status !== "running";

    return <div className="flex flex-col gap-4">
        <Button startContent={<ArrowLeftIcon/>} onPress={() => nav("/monitor")}>
            {t("back-to-list")}
        </Button>
        <Button startContent={<FolderArchive/>} onPress={() => native.game.reveal(gameId, "resourcepacks")}>
            {t("reveal-rsp")}
        </Button>
        <Popover
            placement="top"
            color="foreground"
            isOpen={stopConfirmOpen}
            onOpenChange={setStopConfirmOpen}
        >
            <PopoverTrigger>
                <Button
                    isDisabled={stopDisabled}
                    color="danger"
                    startContent={<OctagonXIcon/>}
                >
                    {t("stop")}
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <div className="flex flex-col gap-2 py-2 px-4 items-center">
                    <div className="flex items-center gap-2">
                        <CircleHelpIcon/>
                        <div className="text-lg font-bold">{t("stop-title")}</div>
                    </div>

                    <div className="text-sm text-foreground-400">{t("stop-sub")}</div>
                    <Button
                        size="sm"
                        color="danger"
                        startContent={<ArrowRightIcon/>}
                        onPress={handleStopAction}
                    >
                        {t("stop-confirm")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    </div>;
}
