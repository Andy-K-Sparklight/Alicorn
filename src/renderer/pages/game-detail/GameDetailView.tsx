import type { GameCoreType } from "@/main/game/spec";
import { useGameList } from "@/renderer/services/game";
import { useNav } from "@/renderer/util/nav";
import { ConfirmPopup } from "@components/ConfirmPopup";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Tab, Tabs } from "@heroui/react";
import { DotIcon, FolderIcon, UnlinkIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "wouter";

export function GameDetailView() {
    const { gameId } = useParams<{ gameId: string }>();
    const games = useGameList();

    const game = games?.find(g => g.id === gameId);

    if (!game) return null;

    const { name, installed, type, launchHint: { containerId, profileId } } = game;

    return <div className="w-full h-full flex flex-col gap-4">
        <div>
            <Header
                id={gameId}
                name={name}
                installed={installed}
                containerId={containerId}
                profileId={profileId}
                type={type}
            />
        </div>
        <div className="grow min-h-0">
            <ManagePanel gameId={gameId}/>
        </div>
    </div>;
}

interface HeaderProps {
    id: string;
    name: string;
    installed: boolean;
    containerId: string;
    profileId: string;
    type: GameCoreType;
}

function Header({ id, name, installed, containerId, profileId, type }: HeaderProps) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.header" });

    function handleReveal() {
        native.game.reveal(id, ".");
    }

    return <div className="p-4 h-32 flex gap-8">
        <div className="h-full rounded-full bg-content2 p-4">
            <GameTypeImage type={type}/>
        </div>

        <div className="flex flex-col gap-1 justify-center grow">
            <div className="font-bold text-2xl">{name}</div>
            <div className="flex text-foreground-400 items-center">
                {id}
                <DotIcon/>
                {
                    t(installed ? "installed" : "not-installed")
                }
                <DotIcon/>
                {t("container", { containerId })}
            </div>
            <div className="flex text-foreground-400 items-center">
                {t("profile", { profileId })}
            </div>
        </div>

        <div className="flex gap-1 items-center">
            <Button startContent={<FolderIcon/>} onPress={handleReveal}>
                {t("reveal")}
            </Button>
        </div>
    </div>;
}

function ManagePanel({ gameId }: { gameId: string }) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage" });

    const tabs = {
        advanced: <AdvancedPanel gameId={gameId}/>
    };

    return <div className="w-5/6 mx-auto h-full">
        <Tabs size="lg" classNames={{ wrapper: "h-full" }} variant="underlined">
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

function AdvancedPanel({ gameId }: { gameId: string }) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced" });
    const nav = useNav();

    async function handleUnlink() {
        await native.game.remove(gameId);
        nav("/games");
    }

    return <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 items-start">
            <div className="font-bold text-lg">{t("unlink.label")}</div>
            <div className="text-sm text-foreground-400">{t("unlink.sub")}</div>

            <ConfirmPopup
                placement="right"
                title={t("unlink.confirm.title")}
                sub={t("unlink.confirm.sub")}
                btnText={t("unlink.confirm.btn")}
                onConfirm={handleUnlink}
            >
                <Button startContent={<UnlinkIcon/>}>{t("unlink.btn")}</Button>
            </ConfirmPopup>
        </div>
    </div>;
}
