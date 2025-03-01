import { alter } from "@/main/util/misc";
import { useGameProfile } from "@/renderer/services/game";
import { remoteInstaller } from "@/renderer/services/install";
import { procService } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { Button } from "@heroui/react";
import { clsx } from "clsx";
import { CirclePlayIcon, DownloadIcon, EllipsisIcon, PinIcon, PinOffIcon, XIcon } from "lucide-react";
import { useState } from "react";

type InstallStatus = "installed" | "installing" | "not-installed";

interface GameActionsProps {
    installStatus: InstallStatus;
    gameId: string;
}

export function GameCardActions({ installStatus, gameId }: GameActionsProps) {
    const [launching, setLaunching] = useState(false);
    const game = useGameProfile(gameId);
    const nav = useNav();

    if (!game) throw "Game actions cannot be used without corresponding game profile";

    const pinned = game.user.pinTime && game.user.pinTime > 0;

    function handleShowDetails() {
        nav(`/game-detail/${gameId}`);
    }

    function handleInstall() {
        void remoteInstaller.install(gameId);
    }

    function handleCancel() {
        void native.install.cancel(gameId);
    }

    function togglePin() {
        void native.game.update(alter(game!, g => {
            if (g.user.pinTime && g.user.pinTime > 0) {
                g.user.pinTime = undefined;
            } else {
                g.user.pinTime = Date.now();
            }
        }));
    }

    async function launch() {
        try {
            setLaunching(true);
            await native.auth.forGame(gameId);

            const procId = await procService.create(gameId);
            nav(`/monitor/${procId}`);
        } finally {
            setLaunching(false);
        }
    }

    return <div className="flex gap-2">
        {
            installStatus === "installed" ?
                <Button isIconOnly isLoading={launching} color="primary" onPress={launch}>
                    <CirclePlayIcon/>
                </Button>
                :
                installStatus === "installing" ?
                    <Button
                        isIconOnly
                        color="danger"
                        onPress={handleCancel}
                    >
                        <XIcon/>
                    </Button>
                    :
                    <Button
                        isIconOnly
                        color="secondary"
                        onPress={handleInstall}
                    >
                        <DownloadIcon/>
                    </Button>
        }

        <Button variant="light" isIconOnly onPress={togglePin}>
            <span className={clsx("duration-200", !pinned && "rotate-45")}>
                 {
                     pinned ? <PinOffIcon/> : <PinIcon/>
                 }
            </span>
        </Button>

        <Button variant="light" isIconOnly onPress={handleShowDetails}>
            <EllipsisIcon/>
        </Button>
    </div>;
}
