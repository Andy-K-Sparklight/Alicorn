import { Radio, RadioGroup } from "@heroui/radio";
import React from "react";
import { useTranslation } from "react-i18next";

interface AssetsLevelSelectorProps {
    assetsLevel: "full" | "video-only";
    onChange: (v: "full" | "video-only") => void;
}

export function AssetLevelSelector({ assetsLevel, onChange }: AssetsLevelSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game.assets-level" });

    return <RadioGroup
        color={assetsLevel === "full" ? "primary" : "warning"}
        value={assetsLevel}
        onValueChange={v => onChange(v as any)}
    >
        <Radio value="full" description={t("full.sub")}>
            {t("full.label")}
        </Radio>
        <Radio value="video-only" description={t("video-only.sub")}>
            {t("video-only.label")}
        </Radio>
    </RadioGroup>;
}
