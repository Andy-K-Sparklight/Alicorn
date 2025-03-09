import { useGameProfile } from "@/renderer/store/games";
import type { PropsWithParams } from "@components/AnimatedRoute";
import { GameTypeImage } from "@components/GameTypeImage";
import { Tab, Tabs } from "@heroui/react";
import { AddonsPanel } from "@pages/game-detail/AddonsPanel";
import { AdvancedPanel } from "@pages/game-detail/AdvancedPanel";
import { GameProfileProvider, useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { LaunchPanel } from "@pages/game-detail/LaunchPanel";
import { LocalAddonsPanel } from "@pages/game-detail/LocalAddonsPanel";
import { ProfilePanel } from "@pages/game-detail/ProfilePanel";
import React from "react";
import { useTranslation } from "react-i18next";

export function GameDetailView({ params: { gameId } }: PropsWithParams<{ gameId: string }>) {
    const game = useGameProfile(gameId);

    if (!game) {
        return null;
    }

    return <GameProfileProvider game={game}>
        <div className="w-full h-full flex flex-col gap-4">
            <CompactHeader/>
            <div className="grow min-h-0 pb-8">
                <ManagePanel/>
            </div>
        </div>
    </GameProfileProvider>;
}

function CompactHeader() {
    const game = useCurrentGameProfile();
    const { id, name, type } = game;

    return <div className="w-full flex items-center gap-4 justify-center">
        <div className="h-10 aspect-square rounded-full bg-content2 p-1">
            <GameTypeImage type={type}/>
        </div>

        <div className="font-bold text-xl">{name}</div>

        <div className="text-foreground-400">{id}</div>
    </div>;
}

function ManagePanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage" });

    const tabs = {
        profile: <ProfilePanel/>,
        launch: <LaunchPanel/>,
        addons: <AddonsPanel/>,
        "local-addons": <LocalAddonsPanel/>,
        advanced: <AdvancedPanel/>
    };

    return <div className="w-5/6 mx-auto h-full">
        <Tabs classNames={{ tabWrapper: "h-full" }} className="px-4" color="primary" fullWidth>
            {
                Object.entries(tabs).map(([id, ele]) =>
                    <Tab key={id} title={t(`${id}.title`)} className="h-full">
                        {ele}
                    </Tab>
                )
            }
        </Tabs>
    </div>;
}
