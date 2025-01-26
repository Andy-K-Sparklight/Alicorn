import type { GameProfile, GameSummary } from "@/main/game/spec";
import grassBlock from "@assets/img/grass-block.webp";
import { Button, Card, CardBody, Chip, Skeleton, Spinner, Tooltip } from "@heroui/react";
import { clsx } from "clsx";
import { CheckCircleIcon, CirclePlayIcon, CloudDownloadIcon, DownloadIcon, EllipsisIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * The index page of game launching, listing user-defined games for playing.
 */
export function GamesView() {
    const [games, setGames] = useState<GameProfile[]>();

    async function loadGames() {
        setGames(await native.game.list());
    }

    useEffect(() => {
        void loadGames();
    }, []);

    return <div className="w-5/6 h-full mx-auto overflow-y-auto">
        <div className="flex flex-col gap-3 w-full">
            {
                games?.map(g => <GameCardDisplay key={g.id} gameId={g.id}/>)
            }
        </div>
    </div>;
}

interface GameCardDisplayProps {
    gameId: string;
}

function GameCardDisplay({ gameId }: GameCardDisplayProps) {
    const [summary, setSummary] = useState<GameSummary>();
    const [error, setError] = useState();

    // TODO error handler

    useEffect(() => {
        native.game.tell(gameId).then(setSummary);
    }, [gameId]);

    if (!summary) {
        return <GameCardSkeleton/>;
    }

    return <GameCard gameSummary={summary}/>;
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
