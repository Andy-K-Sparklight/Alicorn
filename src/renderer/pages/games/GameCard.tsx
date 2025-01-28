import type { GameProfile, GameProfileDetail } from "@/main/game/spec";
import { remoteGame } from "@/renderer/lib/remote-game";
import { GameTypeImage } from "@components/GameTypeImage";
import {
    Alert,
    Button,
    Card,
    CardBody,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Skeleton,
    Spinner,
    Tooltip
} from "@heroui/react";
import { clsx } from "clsx";
import {
    CheckCircleIcon,
    CirclePlayIcon,
    CloudDownloadIcon,
    DownloadIcon,
    EllipsisIcon,
    InfoIcon,
    TrashIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

interface GameCardDisplayProps {
    gameProfile: GameProfile;
}

export function GameCardDisplay({ gameProfile }: GameCardDisplayProps) {
    const [summary, setSummary] = useState<GameProfileDetail>();
    const [error, setError] = useState();

    const { id, name } = gameProfile;

    // TODO error handler

    useEffect(() => {
        native.game.tell(id).then(setSummary).catch(setError);
    }, [id]);

    if (summary) {
        return <GameCard detail={summary}/>;
    }

    if (error !== undefined) {
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
        endContent={
            <Button startContent={<TrashIcon/>} color="danger">
                {t("remove-failed")}
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
    detail: GameProfileDetail;
}

function GameCard({ detail }: GameCardProps) {
    const { id, name, versionId, gameVersion, installed, stable, modLoader } = detail;
    const { t } = useTranslation("pages", { keyPrefix: "games.game-card" });

    const gameVersionChip =
        <Chip color={stable ? "primary" : "warning"} variant="flat">{gameVersion}</Chip>;

    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <div className="h-full p-3 bg-content2 rounded-full">
                    <GameTypeImage loader={modLoader} stable={stable}/>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="font-bold text-xl">{name}</div>
                    <div className="text-foreground-400">{versionId}</div>
                </div>

                <div className="ml-auto flex gap-2 items-center">
                    {
                        stable ?
                            gameVersionChip
                            :
                            <Tooltip content={t("unstable")} color="foreground">
                                {gameVersionChip}
                            </Tooltip>
                    }

                </div>

                <GameStatusBadge installed={installed}/>

                <div className="ml-4">
                    <GameActions detail={detail} installed={installed}/>
                </div>
            </div>
        </CardBody>
    </Card>;
}

function GameStatusBadge({ installed }: { installed: boolean }) {
    const { t } = useTranslation("pages", { keyPrefix: "games.game-card" });

    return <div
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
    </div>;
}

interface GameActionsProps {
    installed: boolean;
    detail: GameProfileDetail;
}

function GameActions({ installed, detail }: GameActionsProps) {
    const [launching, setLaunching] = useState(false);
    const [, nav] = useLocation();

    function launch() {
        setLaunching(true);
        remoteGame.create(detail).then((procId) => {
            setLaunching(false);
            nav(`/Monitor/${procId}`);
        });
    }

    return <div className="flex gap-2">
        {
            // TODO bind button actions
            installed ?
                <Button isIconOnly isLoading={launching} color="primary" onPress={launch}>
                    <CirclePlayIcon/>
                </Button>
                :
                <Button isIconOnly color="secondary">
                    <DownloadIcon/>
                </Button>
        }

        <GameCardDropdown/>
    </div>;
}

function GameCardDropdown() {
    const { t } = useTranslation("pages", { keyPrefix: "games.game-card" });

    return <Dropdown>
        <DropdownTrigger>
            <Button isIconOnly>
                <EllipsisIcon/>
            </Button>
        </DropdownTrigger>
        <DropdownMenu>
            <DropdownItem key="info" startContent={<InfoIcon/>}>
                {t("info")}
            </DropdownItem>
            <DropdownItem
                color="danger"
                className="text-danger"
                key="remove"
                startContent={<TrashIcon/>}
            >
                {t("remove")}
            </DropdownItem>
        </DropdownMenu>
    </Dropdown>;
}
