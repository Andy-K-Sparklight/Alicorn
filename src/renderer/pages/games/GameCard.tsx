import type { GameProfile, GameSummary } from "@/main/game/spec";
import grassBlock from "@assets/img/grass-block.webp";
import { Alert, Button, Card, CardBody, Chip, Skeleton, Spinner, Tooltip } from "@heroui/react";
import { clsx } from "clsx";
import {
    CheckCircleIcon,
    CirclePlayIcon,
    CloudDownloadIcon,
    DownloadIcon,
    EllipsisIcon,
    TrashIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface GameCardDisplayProps {
    gameProfile: GameProfile;
}

export function GameCardDisplay({ gameProfile }: GameCardDisplayProps) {
    const [summary, setSummary] = useState<GameSummary>();
    const [error, setError] = useState();

    const { id, name } = gameProfile;

    // TODO error handler

    useEffect(() => {
        native.game.tell(id).then(setSummary).catch(setError);
    }, [id]);

    if (summary) {
        return <GameCard gameSummary={summary}/>;
    }

    if (error) {
        // TODO add error message
        return <GameLoadFailedAlert name={name} id={id}/>;
    }

    return <GameCardSkeleton/>;
}

interface GameLoadFailedAlertProps {
    name: string;
    id: string;
}

function GameLoadFailedAlert({ name, id }: GameLoadFailedAlertProps) {
    const { t } = useTranslation("pages", { keyPrefix: "games" });

    return <Alert
        classNames={{ title: "font-bold" }}
        color="danger"
        title={t("load-failed", { name, id })}
        description=""
        endContent={
            <Button color="danger">
                <div className="flex items-center gap-1">
                    <TrashIcon/>
                    {t("remove-failed")}
                </div>
            </Button>
        }
    />;
}

function GameCardSkeleton() {
    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <Skeleton className="h-full aspect-square rounded-full"/>

                <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-36 rounded-full"/>
                    <Skeleton className="h-3 w-64 rounded-full"/>
                </div>

                <Skeleton className="ml-auto h-5 w-36 rounded-full"/>

                <Spinner className="ml-4" color="default"/>
            </div>
        </CardBody>
    </Card>;
}

interface GameCardProps {
    gameSummary: GameSummary;
}

function GameCard({ gameSummary }: GameCardProps) {
    const { t } = useTranslation("pages", { keyPrefix: "games.game-card" });

    const { name, versionId, gameVersion, installed } = gameSummary;

    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <div className="h-full p-3 bg-content2 rounded-full">
                    {/* TODO icon based on loader type */}
                    <img src={grassBlock} alt="Vanilla Game Type" className="w-full h-full object-contain"/>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="font-bold text-xl">{name}</div>
                    <div className="text-foreground-400">{versionId}</div>
                </div>

                <div className="ml-auto flex gap-2 items-center">
                    {/* TODO color based on snapshot / release */}
                    <Chip color="primary" variant="flat">{gameVersion}</Chip>
                </div>

                <div
                    className={
                        clsx({
                            "text-success": installed,
                            "text-warning": !installed
                        })
                    }
                >
                    <Tooltip content={t(installed ? "ready" : "unready")} color="foreground">
                        {
                            installed ? <CheckCircleIcon/> : <CloudDownloadIcon/>
                        }
                    </Tooltip>
                </div>

                <div className="ml-4 flex gap-2">
                    {
                        // TODO bind button actions
                        installed ?
                            <Button isIconOnly color="primary">
                                <CirclePlayIcon/>
                            </Button>
                            :
                            <Button isIconOnly color="secondary">
                                <DownloadIcon/>
                            </Button>
                    }

                    <Button isIconOnly>
                        <EllipsisIcon/>
                    </Button>
                </div>
            </div>
        </CardBody>
    </Card>;
}
