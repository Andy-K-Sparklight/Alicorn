import type { GameProfile } from "@/main/game/spec";
import { remoteInstaller, useInstallProgress } from "@/renderer/services/install";
import { procService } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Card, CardBody, Chip, Tooltip } from "@heroui/react";
import { clsx } from "clsx";
import { CheckCircleIcon, CirclePlayIcon, CloudDownloadIcon, DotIcon, DownloadIcon, EllipsisIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

interface GameCardDisplayProps {
    game: GameProfile;
}

export function GameCardDisplay({ game }: GameCardDisplayProps) {
    return <GameCard profile={game}/>;
}

interface GameCardProps {
    profile: GameProfile;
}

function GameCard({ profile }: GameCardProps) {
    const { id, name, versions: { game: gameVersion }, installed, type } = profile;
    const { t } = useTranslation("pages", { keyPrefix: "games.game-card" });
    const { t: tc } = useTranslation("common", { keyPrefix: "progress" });
    const installProgress = useInstallProgress(id);

    const isInstalling = installProgress !== null;
    const installStatus = installed ? "installed" : isInstalling ? "installing" : "not-installed";

    const progressText = installProgress && tc(installProgress.state, { ...installProgress.value });

    async function handleInstall() {
        await remoteInstaller.install(id);
        toast(t("installed"), { type: "success" });
    }

    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <div className="h-full p-3 bg-content2 rounded-full">
                    <GameTypeImage type={type}/>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="font-bold text-xl">{name}</div>
                    <div className="flex items-center text-foreground-400">
                        {id}
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
                    <Chip color="primary" variant="flat">{gameVersion}</Chip>
                </div>

                <GameStatusBadge installed={installed}/>

                <div className="ml-4">
                    <GameActions
                        gameId={id}
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
    gameId: string;
    onInstall: () => void;
}

function GameActions({ installStatus, gameId, onInstall }: GameActionsProps) {
    const [launching, setLaunching] = useState(false);
    const nav = useNav();

    async function launch() {
        setLaunching(true);
        const authed = await native.auth.forGame(gameId);

        if (!authed) {
            toast(AuthFailedToast, { type: "error" });
            return;
        }

        // TODO add error handler
        const procId = await procService.create(gameId);
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

        <Button isIconOnly>
            <EllipsisIcon/>
        </Button>
    </div>;
}

function AuthFailedToast() {
    const { t } = useTranslation("pages", { keyPrefix: "games.auth-failed" });

    return <div className="flex flex-col gap-1 mx-4">
        <div className="font-bold text-xl">{t("title")}</div>
        <div className="text-medium">{t("sub")}</div>
    </div>;
}
