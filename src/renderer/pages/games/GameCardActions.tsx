import { procService } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { Button } from "@heroui/react";
import { CirclePlayIcon, DownloadIcon, EllipsisIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

type InstallStatus = "installed" | "installing" | "not-installed";

interface GameActionsProps {
    installStatus: InstallStatus;
    gameId: string;
    onInstall: () => void;
}

export function GameCardActions({ installStatus, gameId, onInstall }: GameActionsProps) {
    const [launching, setLaunching] = useState(false);
    const nav = useNav();

    function handleShowDetails() {
        nav(`/game-detail/${gameId}`);
    }

    async function launch() {
        setLaunching(true);
        const authed = await native.auth.forGame(gameId);

        if (!authed) {
            toast(<AuthFailedToast/>, { type: "error" });
            setLaunching(false);
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

        <Button isIconOnly onPress={handleShowDetails}>
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
