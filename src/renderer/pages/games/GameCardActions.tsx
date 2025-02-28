import { remoteInstaller } from "@/renderer/services/install";
import { procService } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { Button } from "@heroui/react";
import { CirclePlayIcon, DownloadIcon, EllipsisIcon, XIcon } from "lucide-react";
import { useState } from "react";

type InstallStatus = "installed" | "installing" | "not-installed";

interface GameActionsProps {
    installStatus: InstallStatus;
    gameId: string;
}

export function GameCardActions({ installStatus, gameId }: GameActionsProps) {
    const [launching, setLaunching] = useState(false);
    const nav = useNav();

    function handleShowDetails() {
        nav(`/game-detail/${gameId}`);
    }

    function handleInstall() {
        void remoteInstaller.install(gameId);
    }

    function handleCancel() {
        void native.install.cancel(gameId);
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

        <Button isIconOnly onPress={handleShowDetails}>
            <EllipsisIcon/>
        </Button>
    </div>;
}
