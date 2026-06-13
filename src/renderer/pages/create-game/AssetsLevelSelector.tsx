import { Description, Label, Radio, RadioGroup } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { GameAssetsLevel } from "@/main/game/spec";

interface AssetsLevelSelectorProps {
    assetsLevel: GameAssetsLevel;
    onChange: (v: GameAssetsLevel) => void;
}

export function AssetLevelSelector({ assetsLevel, onChange }: AssetsLevelSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game.assets-level" });

    return (
        <RadioGroup value={assetsLevel} onChange={v => onChange(v as GameAssetsLevel)}>
            <Radio value="full">
                <Radio.Control>
                    <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                    <Label>{t("full.label")}</Label>
                    <Description>{t("full.sub")}</Description>
                </Radio.Content>
            </Radio>
            <Radio value="video-only">
                <Radio.Control>
                    <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                    <Label>{t("video-only.label")}</Label>
                    <Description>{t("video-only.sub")}</Description>
                </Radio.Content>
            </Radio>
        </RadioGroup>
    );
}
