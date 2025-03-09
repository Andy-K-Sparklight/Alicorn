import type { GameProfile } from "@/main/game/spec";
import { useInstallProgress } from "@/renderer/services/install";
import { GameTypeImage } from "@components/GameTypeImage";
import { Card, CardBody, Chip, cn } from "@heroui/react";
import { GameCardActions } from "@pages/games/GameCardActions";
import { DotIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GameCardProps {
    game: GameProfile;
}

export function GameCard({ game }: GameCardProps) {
    const { t } = useTranslation("pages", { keyPrefix: "game-card" });

    const { id, name, versions: { game: gameVersion }, installed, type } = game;
    const { t: tc } = useTranslation("common", { keyPrefix: "progress" });
    const installProgress = useInstallProgress(id);
    const pinned = game.user.pinTime && game.user.pinTime > 0;

    const isInstalling = installProgress !== null;
    const installStatus = isInstalling ? "installing" : installed ? "installed" : "not-installed";

    const progressText = installProgress && tc(installProgress.state, { ...installProgress.value });

    return <Card shadow="sm" className={cn(pinned && "outline-2 outline-default-500")}>
        <CardBody>
            <div className="flex gap-6 items-center px-3">
                <div className="w-12 h-12 p-2 bg-content2 rounded-full">
                    <GameTypeImage type={type}/>
                </div>

                <div className="flex flex-col">
                    <div className="font-bold text-lg">{name}</div>
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
                    <Chip color="default" variant="flat">{t(`type.${type}`)}</Chip>
                </div>

                <div className="ml-4">
                    <GameCardActions
                        gameId={id}
                        installStatus={installStatus}
                    />
                </div>
            </div>
        </CardBody>
    </Card>;
}
