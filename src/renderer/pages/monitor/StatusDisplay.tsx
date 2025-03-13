import type { GameCoreType } from "@/main/game/spec";
import type { RemoteGameStatus } from "@/renderer/services/proc";
import { GameTypeIcon } from "@components/display/GameTypeIcon";
import { Card, CardBody, cn } from "@heroui/react";
import React from "react";
import { useTranslation } from "react-i18next";

export const StatusDisplayMemo = React.memo(StatusDisplay);

interface StatusDisplayProps {
    id: string;
    name: string;
    profileId: string;
    type: GameCoreType;
    status: RemoteGameStatus;
    uptime: number;
    pid: number;
}

function StatusDisplay({ id, name, profileId, type, status, uptime, pid }: StatusDisplayProps) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor" });

    return <Card className="h-full">
        <CardBody>
            <div className="flex flex-col h-full px-6 items-center justify-evenly">
                <div className="w-full flex gap-6 justify-center items-center">
                    <GameTypeIcon
                        className={
                            cn("w-12 outline outline-2 outline-offset-4 rounded-xl", {
                                "outline-success": status === "running",
                                "outline-default": status === "exited",
                                "outline-danger": status === "crashed"
                            })
                        }
                        gameType={type}
                    />

                    <div className="flex flex-col gap-1">
                        <div className="font-bold text-lg">{name}</div>
                        <div className="text-foreground-400">{id}</div>
                    </div>
                </div>

                <div className="flex flex-col w-full gap-1">
                    <DataSlot label={t("label.status")} value={t(`status.${status}`)}/>
                    <DataSlot label={t("label.uptime")} value={formatTime(uptime)}/>
                    <DataSlot label={t("label.pid")} value={pid.toString()}/>
                    <DataSlot label={t("label.profile")} value={profileId}/>
                </div>
            </div>
        </CardBody>
    </Card>;
}

function DataSlot({ label, value }: { label: string, value: string }) {
    return <div className="flex text-sm flex-wrap gap-1">
        <div className="text-foreground-400">{label}</div>
        <div className="ml-auto">{value}</div>
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
