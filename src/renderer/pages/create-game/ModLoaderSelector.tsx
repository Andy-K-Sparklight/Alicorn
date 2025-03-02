import { Radio, RadioGroup } from "@heroui/radio";
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
                ["vanilla", "fabric", "quilt", "neoforged", "forge", "rift"].map(lv => {
                    if (!loaders.includes(lv)) return null;

                    return <Radio key={lv} value={lv} description={t(`${lv}.sub`)}>
                        {t(`${lv}.label`)}
                    </Radio>;
                })
            }
        </RadioGroup>

        <div className="text-sm text-foreground-400">{t("missing")}</div>
    </>;


}
