import type { GameCoreType } from "@/main/game/spec";
import type { RemoteGameStatus } from "@/renderer/services/proc";
import { GameTypeImage } from "@components/GameTypeImage";
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
    alxConnected: boolean;
}

function StatusDisplay({ id, name, profileId, type, status, uptime, pid, alxConnected }: StatusDisplayProps) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor" });

    return <Card className="h-full">
        <CardBody>
            <div className="flex flex-col h-full px-6 items-center justify-evenly">
                <div className="w-full flex gap-6 justify-center items-center">
                    <div
                        className={
                            cn("h-16 aspect-square p-2 bg-content2 rounded-full outline outline-2 outline-offset-4", {
                                "outline-success": status === "running",
                                "outline-default": status === "exited",
                                "outline-danger": status === "crashed"
                            })
                        }
                    >
                        <GameTypeImage type={type}/>
                    </div>

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
                    <DataSlot
                        label={t("label.alx")}
                        value={t("alx-status." + (alxConnected ? "connected" : "disconnected"))}
                    />
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
