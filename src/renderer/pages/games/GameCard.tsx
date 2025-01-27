import type { GameProfile, GameProfileDetail } from "@/main/game/spec";
import damagedAnvil from "@assets/img/damaged-anvil.webp";
import fabric from "@assets/img/fabric.webp";
import grassBlock from "@assets/img/grass-block.webp";
import neoForged from "@assets/img/neoforged.webp";
import quilt from "@assets/img/quilt.webp";
import snowyGrassBlock from "@assets/img/snowy-grass-block.webp";
import tnt from "@assets/img/tnt.webp";
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
                <GameTypeImage loader={modLoader} stable={stable}/>

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
                    <GameActions gameId={id} installed={installed}/>
                </div>
            </div>
        </CardBody>
    </Card>;
}

function GameTypeImage({ loader, stable }: { loader: string, stable: boolean }) {
    let src: string;

    switch (loader) {
        case "":
            src = stable ? grassBlock : snowyGrassBlock;
            break;
        case "quilt":
            src = quilt;
            break;
        case "fabric":
            src = fabric;
            break;
        case "neoforged":
            src = neoForged;
            break;
        case "forge":
            src = damagedAnvil;
            break;
        default:
            src = tnt;
            break;
    }


    return <div className="h-full p-3 bg-content2 rounded-full">
        <img src={src} alt={loader ?? "vanilla"} className="w-full h-full object-contain"/>
    </div>;
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
    gameId: string;
}

function GameActions({ installed }: GameActionsProps) {
    return <div className="flex gap-2">
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
