import type { GameAssetsLevel } from "@/main/game/spec";
import { Radio, RadioGroup } from "@heroui/react";
import React from "react";
import { useTranslation } from "react-i18next";

interface AssetsLevelSelectorProps {
    assetsLevel: GameAssetsLevel;
    onChange: (v: GameAssetsLevel) => void;
}

export function AssetLevelSelector({ assetsLevel, onChange }: AssetsLevelSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game.assets-level" });

    return <RadioGroup
        color={assetsLevel === "full" ? "primary" : "warning"}
        value={assetsLevel}
        onValueChange={v => onChange(v as GameAssetsLevel)}
    >
        <Radio value="full" description={t("full.sub")}>
            {t("full.label")}
        </Radio>
        <Radio value="video-only" description={t("video-only.sub")}>
            {t("video-only.label")}
        </Radio>
    </RadioGroup>;
}
