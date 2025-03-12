import { alter } from "@/main/util/misc";
import { useGameProfile } from "@/renderer/services/games";
import { Alert } from "@components/Alert";
import type { PropsWithParams } from "@components/AnimatedRoute";
import { ConfirmPopup } from "@components/ConfirmPopup";
import { GameTypeIcon } from "@components/GameTypeIcon";
import { Button, Tab, Tabs } from "@heroui/react";
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
            <LockedAlert/>
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
        <GameTypeIcon className="h-10" gameType={type}/>

        <div className="font-bold text-xl">{name}</div>

        <div className="text-foreground-400">{id}</div>
    </div>;
}

function LockedAlert() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail" });
    const game = useCurrentGameProfile();

    function handleUnlock() {
        void native.game.update(alter(game, g => g.locked = false));
    }

    if (!game.locked) return null;

    return <div className="w-2/3 mx-auto">
        <Alert
            color="warning"
            title={t("locked-alert")}
            className="px-4 py-2"
            endContent={
                <ConfirmPopup
                    title={t("unlock.popover.title")}
                    sub={t("unlock.popover.sub")}
                    btnText={t("unlock.popover.btn")}
                    onConfirm={handleUnlock}
                    color="warning"
                    placement="bottom"
                >
                    <Button color="warning">{t("unlock.btn")}</Button>
                </ConfirmPopup>
            }
        />
    </div>;
}

function ManagePanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage" });

    const game = useCurrentGameProfile();
    const isLocked = game.locked;

    const tabs = {
        profile: <ProfilePanel/>,
        launch: <LaunchPanel/>,
        addons: !isLocked && <AddonsPanel/>,
        "local-addons": !isLocked && <LocalAddonsPanel/>,
        advanced: <AdvancedPanel/>
    };

    return <div className="w-5/6 mx-auto h-full">
        <Tabs classNames={{ tabWrapper: "h-full" }} className="px-4" color="primary" fullWidth>
            {
                Object.entries(tabs)
                    .filter(([, ele]) => !!ele)
                    .map(([id, ele]) =>
                        <Tab key={id} title={t(`${id}.title`)} className="h-full">
                            {ele}
                        </Tab>
                    )
            }
        </Tabs>
    </div>;
}
