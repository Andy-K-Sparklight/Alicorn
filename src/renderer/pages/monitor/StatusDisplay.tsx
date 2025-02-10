import type { GameCoreType } from "@/main/game/spec";
import type { RemoteGameStatus } from "@/renderer/services/proc";
import { GameTypeImage } from "@components/GameTypeImage";
import { Card, CardBody } from "@heroui/react";
import { clsx } from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";

export const StatusDisplayMemo = React.memo(StatusDisplay);

interface StatusDisplayProps {
    id: string;
    name: string;
    type: GameCoreType;
    status: RemoteGameStatus;
    uptime: number;
    pid: number;
}

function StatusDisplay({ id, name, type, status, uptime, pid }: StatusDisplayProps) {
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
                    <DataSlot label={t("label.status")} value={t(`status.${status}`)}/>
                    <DataSlot label={t("label.uptime")} value={formatTime(uptime)}/>
                    <DataSlot label={t("label.pid")} value={pid.toString()}/>
                </div>
            </div>
        </CardBody>
    </Card>;
}

function DataSlot({ label, value }: { label: string, value: string }) {
    return <div className="flex text-sm">
        <div className="grow text-foreground-400">{label}</div>
        <div>{value}</div>
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
