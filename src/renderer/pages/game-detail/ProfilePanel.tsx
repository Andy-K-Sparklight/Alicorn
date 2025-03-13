import type { GameCoreType } from "@/main/game/spec";
import { alter } from "@/main/util/misc";
import { GameTypeIcon } from "@components/display/GameTypeIcon";
import { Editable } from "@components/input/Editable";
import { Button, ButtonGroup } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { EditIcon, FolderIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

function coerceLoaderType(type: GameCoreType): string {
    if (type.startsWith("vanilla")) return "vanilla";
    return type;
}

export function ProfilePanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.profile" });
    const { t: tc } = useTranslation("common");
    const game = useCurrentGameProfile();
    const { id, name, installed, type, launchHint: { containerId, profileId }, versions } = game;

    function handleReveal() {
        native.game.reveal(id, ".");
    }

    function handleNameChange(newName: string) {
        void native.game.update(alter(game, g => g.name = newName));
    }

    const properties = [
        [t("profile"), profileId],
        [t("version"), versions.game],
        [t("container"), containerId],
        [t("loader"), tc("loader." + coerceLoaderType(type))],
        [t("install-status"), t(installed ? "installed" : "not-installed")]
    ];

    return <div className="mx-auto py-8 w-5/6 h-full">
        <div className="flex flex-col min-h-0 overflow-y-auto gap-12 px-8 py-10 w-full h-full rounded-xl bg-content1">
            <div className="flex gap-8 justify-center">
                <GameTypeIcon className="w-16" gameType={type}/>

                <div className="flex flex-col gap-1 justify-center">
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

                    <code className="text-foreground-500">
                        {containerId} / {profileId}
                    </code>
                </div>
            </div>

            <div className="flex flex-col gap-8 grow w-2/3 mx-auto">
                <div className="flex flex-col grow my-2 gap-4 justify-center">
                    {
                        properties.map((p, i) =>
                            <div key={i} className="flex items-center">
                                <div className="font-bold">{p[0]}</div>
                                <div className="ml-auto text-foreground-500">{p[1]}</div>
                            </div>
                        )
                    }
                </div>
                <div className="flex justify-center">
                    <ButtonGroup>
                        <Button onPress={handleReveal} startContent={<FolderIcon/>}>{t("reveal")}</Button>
                    </ButtonGroup>
                </div>
            </div>
        </div>
    </div>;
}
