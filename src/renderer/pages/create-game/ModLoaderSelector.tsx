import type { GameCoreType } from "@/main/game/spec";
import { CardRadio } from "@components/CardRadio";
import { GameTypeIcon } from "@components/GameTypeIcon";
import { RadioGroup } from "@heroui/radio";
import { Spinner } from "@heroui/react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ModLoaderSelectorProps {
    availableModLoaders: string[] | null;
    value: string;
    onChange: (v: string) => void;
}

export function ModLoaderSelector({ availableModLoaders, value, onChange }: ModLoaderSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game.mod-loader" });

    const loaders = availableModLoaders ?? [];

    loaders.unshift("vanilla");

    useEffect(() => {
        if (availableModLoaders && !availableModLoaders.includes(value)) {
            onChange("vanilla");
        }
    }, [availableModLoaders]);

    return <>
        <RadioGroup
            value={value}
            onValueChange={onChange}
        >
            {
                !availableModLoaders &&
                <div className="w-full flex justify-center items-center gap-6 my-2">
                    <Spinner variant="wave"/>
                    {t("loading")}
                </div>
            }
            {
                (["vanilla", "fabric", "quilt", "neoforged", "forge", "rift", "liteloader", "optifine"] as const)
                    .map(lv => {
                        // Allow mod loaders to be chosen before availability check in case the network is slow
                        if (availableModLoaders !== null && !loaders.includes(lv)) return null;

                        const iconType: GameCoreType = lv === "vanilla" ? "vanilla-release" : lv;

                        return <CardRadio key={lv} value={lv}>
                            <div className="flex gap-4 items-center">
                                <GameTypeIcon className="h-12" gameType={iconType}/>

                                <div className="flex flex-col gap-1">
                                    <div>{t(`${lv}.label`)}</div>
                                    <div className="text-sm text-foreground-400"> {t(`${lv}.sub`)}</div>
                                </div>
                            </div>
                        </CardRadio>;
                    })
            }
        </RadioGroup>

        <div className="text-sm text-foreground-400">{t("missing")}</div>
    </>;


}
