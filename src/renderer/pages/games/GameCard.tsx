import type { GameProfileDetail } from "@/main/game/spec";
import { remoteInstaller, useInstallProgress } from "@/renderer/services/install";
import { procService } from "@/renderer/services/proc";
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
    DotIcon,
    DownloadIcon,
    EllipsisIcon,
    InfoIcon,
    TrashIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useLocation } from "wouter";

interface GameCardDisplayProps {
    id: string;
    name: string;
}

export function GameCardDisplay({ id, name }: GameCardDisplayProps) {
    const [summary, setSummary] = useState<GameProfileDetail>();
    const [error, setError] = useState();

    function loadGameDetail() {
        native.game.tell(id).then(setSummary).catch(setError);
    }

    useEffect(() => {
        loadGameDetail();
    }, [id]);

    if (summary) {
        return <GameCard detail={summary} onReload={loadGameDetail}/>;
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
    onReload: () => void;
}

function GameCard({ detail, onReload }: GameCardProps) {
    const { id, name, versionId, gameVersion, installed, stable, modLoader } = detail;
    const { t } = useTranslation("pages", { keyPrefix: "games.game-card" });
    const { t: tc } = useTranslation("common", { keyPrefix: "progress" });
    const installProgress = useInstallProgress(id);

    const isInstalling = installProgress !== null;
    const installStatus = installed ? "installed" : isInstalling ? "installing" : "not-installed";

    const progressText = installProgress && tc(installProgress.state, { ...installProgress.value });
    const gameVersionChip =
        <Chip color={stable ? "primary" : "warning"} variant="flat">{gameVersion}</Chip>;

    useEffect(() => {
        onReload();
    }, [installStatus]);

    async function handleInstall() {
        await remoteInstaller.install(id);
        toast(t("installed"), { type: "success" });
    }

    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <div className="h-full p-3 bg-content2 rounded-full">
                    <GameTypeImage loader={modLoader} stable={stable}/>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="font-bold text-xl">{name}</div>
                    <div className="flex items-center text-foreground-400">
                        {id}
                        <DotIcon/>
                        {versionId}
                        {
                            progressText &&
                            <>
                                <DotIcon/>
                                {progressText}
                            </>
                        }
                    </div>
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
                    <GameActions
                        detail={detail}
                        installStatus={installStatus}
                        onInstall={handleInstall}
                    />
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

type InstallStatus = "installed" | "installing" | "not-installed";

interface GameActionsProps {
    installStatus: InstallStatus;
    detail: GameProfileDetail;
    onInstall: () => void;
}

function GameActions({ installStatus, detail, onInstall }: GameActionsProps) {
    const [launching, setLaunching] = useState(false);
    const [, nav] = useLocation();

    async function launch() {
        setLaunching(true);
        const authed = await native.auth.forGame(detail.id);

        if (!authed) {
            toast(AuthFailedToast, { type: "error" });
            return;
        }

        // TODO add error handler
        const procId = await procService.create(detail);
        setLaunching(false);
        nav(`/monitor/${procId}`);
    }

    return <div className="flex gap-2">
        {
            // TODO bind button actions
            installStatus === "installed" ?
                <Button isIconOnly isLoading={launching} color="primary" onPress={launch}>
                    <CirclePlayIcon/>
                </Button>
                :
                <Button
                    isIconOnly
                    isLoading={installStatus === "installing"}
                    color="secondary"
                    onPress={onInstall}
                >
                    <DownloadIcon/>
                </Button>
        }

        <GameCardDropdown/>
    </div>;
}

function AuthFailedToast() {
    const { t } = useTranslation("pages", { keyPrefix: "games.auth-failed" });

    return <div className="flex flex-col gap-1 mx-4">
        <div className="font-bold text-xl">{t("title")}</div>
        <div className="text-medium">{t("sub")}</div>
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
