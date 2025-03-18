import { alter } from "@/main/util/misc";
import { useGameProfile } from "@/renderer/services/games";
import { remoteInstaller } from "@/renderer/services/install";
import { procService } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { useOpenDialog } from "@components/modal/DialogProvider";
import { YggdrasilFormDialog } from "@components/modal/YggdrasilFormDialog";
import { Button, cn } from "@heroui/react";
import { CirclePlayIcon, DownloadIcon, EllipsisIcon, PinIcon, PinOffIcon, XIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type InstallStatus = "installed" | "installing" | "not-installed";

interface GameActionsProps {
    installStatus: InstallStatus;
    gameId: string;
}

export function GameCardActions({ installStatus, gameId }: GameActionsProps) {
    const { t } = useTranslation("pages", { keyPrefix: "game-card" });
    const game = useGameProfile(gameId);
    const [launching, setLaunching] = useState(false);
    const [yggdrasilFormOpen, setYggdrasilFormOpen] = useState(false);
    const [yggdrasilFormKey, setYggdrasilFormKey] = useState("");
    const [yggdrasilEmail, setYggdrasilEmail] = useState("");
    const [yggdrasilHost, setYggdrasilHost] = useState("");
    const openAccountSelector = useOpenDialog<string>();

    const isRequestingLogin = useRef(false);
    const nav = useNav();

    if (!game) throw "Game actions cannot be used without corresponding game profile";

    const pinned = game.user.pinTime && game.user.pinTime > 0;

    function handleShowDetails() {
        nav(`/games/detail/${gameId}`);
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

    function handleAccountRefreshed() {
        void launch();
    }

    async function launch() {
        try {
            setLaunching(true);
            if (game && !game?.launchHint.accountId) {
                const aid = await openAccountSelector();
                await native.game.update(alter(game, g => g.launchHint.accountId = aid));
            }

            const res = await native.auth.forGame(gameId);

            if (typeof res === "object") {
                isRequestingLogin.current = true;
                setYggdrasilFormKey(nanoid());
                setYggdrasilFormOpen(true);
                setYggdrasilEmail(res.email);
                setYggdrasilHost(res.host);
            } else {
                const procId = await procService.create(gameId);
                nav(`/monitor/${procId}`);
            }
        } finally {
            setLaunching(false);
        }
    }

    return <div className="flex gap-2">
        {
            installStatus === "installed" ?
                <Button
                    startContent={!launching && <CirclePlayIcon/>}
                    isLoading={launching}
                    color="primary"
                    onPress={launch}
                >
                    {t("launch")}
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
                        color="secondary"
                        onPress={handleInstall}
                        startContent={<DownloadIcon/>}
                    >
                        {t("download")}
                    </Button>
        }

        <div className="flex gap-1">
            <Button variant="light" isIconOnly onPress={togglePin}>
            <span className={cn("duration-200", !pinned && "rotate-45")}>
                 {
                     pinned ? <PinOffIcon/> : <PinIcon/>
                 }
            </span>
            </Button>

            <Button variant="light" isIconOnly onPress={handleShowDetails}>
                <EllipsisIcon/>
            </Button>
        </div>

        <YggdrasilFormDialog
            email={yggdrasilEmail}
            host={yggdrasilHost}
            key={yggdrasilFormKey}
            isOpen={yggdrasilFormOpen}
            onClose={() => setYggdrasilFormOpen(false)}
            onAccountAdded={handleAccountRefreshed}
        />
    </div>;
}
