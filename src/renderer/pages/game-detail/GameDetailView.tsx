import { alter } from "@/main/util/misc";
import { useGameProfile } from "@/renderer/services/game";
import type { PropsWithParams } from "@components/AnimatedRoute";
import { Editable } from "@components/Editable";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Tab, Tabs } from "@heroui/react";
import { AdvancedPanel } from "@pages/game-detail/AdvancedPanel";
import { GameProfileProvider, useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { LaunchPanel } from "@pages/game-detail/LaunchPanel";
import { DotIcon, EditIcon, FolderIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function GameDetailView({ params: { gameId } }: PropsWithParams<{ gameId: string }>) {
    const game = useGameProfile(gameId);

    if (!game) {
        return null;
    }

    return <GameProfileProvider game={game}>
        <div className="w-full h-full flex flex-col gap-4">
            <Header/>
            <div className="grow min-h-0 pb-8">
                <ManagePanel/>
            </div>
        </div>
    </GameProfileProvider>;
}

function Header() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.header" });
    const game = useCurrentGameProfile();
    const { id, name, installed, type, launchHint: { containerId, profileId } } = game;

    function handleReveal() {
        native.game.reveal(id, ".");
    }

    function handleNameChange(newName: string) {
        void native.game.update(alter(game, g => g.name = newName));
    }

    return <div className="p-4 h-32 flex gap-8">
        <div className="h-full rounded-full bg-content2 p-4">
            <GameTypeImage type={type}/>
        </div>

        <div className="flex flex-col gap-1 justify-center grow">
            <Editable
                value={name}
                onValueChange={handleNameChange}
                inputProps={{ classNames: { input: "text-xl" } }}
            >
                <div className="flex gap-2 items-center font-bold text-2xl">
                    {name}
                    <span className="text-foreground-400 cursor-pointer">
                        <EditIcon/>
                    </span>
                </div>
            </Editable>

            <div className="flex text-foreground-400 items-center">
                {id}
                <DotIcon/>
                {
                    t(installed ? "installed" : "not-installed")
                }
                <DotIcon/>
                {t("container", { containerId })}
            </div>
            {
                profileId && <div className="flex text-foreground-400 items-center">
                    {t("profile", { profileId })}
                </div>
            }

        </div>

        <div className="flex gap-1 items-center">
            <Button startContent={<FolderIcon/>} onPress={handleReveal}>
                {t("reveal")}
            </Button>
        </div>
    </div>;
}

function ManagePanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage" });

    const tabs = {
        launch: <LaunchPanel/>,
        advanced: <AdvancedPanel/>
    };

    return <div className="w-5/6 mx-auto h-full">
        <Tabs size="lg" classNames={{ tabWrapper: "h-full" }} variant="underlined">
            {
                Object.entries(tabs).map(([id, ele]) =>
                    <Tab key={id} title={t(`${id}.title`)} className="h-full">
                        <div className="w-full h-full overflow-y-auto">
                            <div className="px-4 py-2">
                                {ele}
                            </div>
                        </div>
                    </Tab>
                )
            }
        </Tabs>
    </div>;
}
