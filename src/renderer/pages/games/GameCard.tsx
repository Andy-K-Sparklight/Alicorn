import type { GameProfile } from "@/main/game/spec";
import { useInstallProgress } from "@/renderer/services/install";
import { GameTypeImage } from "@components/GameTypeImage";
import { Card, CardBody, Chip } from "@heroui/react";
import { GameCardActions } from "@pages/games/GameCardActions";
import { DotIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GameCardProps {
    game: GameProfile;
}

export function GameCard({ game }: GameCardProps) {
    const { id, name, versions: { game: gameVersion }, installed, type } = game;
    const { t: tc } = useTranslation("common", { keyPrefix: "progress" });
    const installProgress = useInstallProgress(id);

    const isInstalling = installProgress !== null;
    const installStatus = isInstalling ? "installing" : installed ? "installed" : "not-installed";

    const progressText = installProgress && tc(installProgress.state, { ...installProgress.value });

    return <Card shadow="sm">
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
