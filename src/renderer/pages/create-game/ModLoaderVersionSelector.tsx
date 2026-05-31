import { Alert } from "@components/display/Alert";
import { Input, Label, Radio, RadioGroup, TextField } from "@heroui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ModLoaderVersionSelectorProps {
    value: string;
    onChange: (v: string) => void;
}

export function ModLoaderVersionSelector({ value, onChange }: ModLoaderVersionSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: `create-game.loader-version` });
    const [isAuto, setIsAuto] = useState(true);

    function handleSelectionChange(v: string) {
        if (v === "auto") {
            onChange("");
        }
        setIsAuto(v !== "manual");
    }

    return (
        <div className="p-4 border-solid border-2 border-foreground-400 rounded-xl flex flex-col gap-4">
            <div className="font-bold text-base">{t("title")}</div>

            <RadioGroup value={isAuto ? "auto" : "manual"} onChange={handleSelectionChange}>
                {["auto", "manual"].map(lv => (
                    <Radio key={lv} value={lv}>
                        <Radio.Control>
                            <Radio.Indicator />
                        </Radio.Control>
                        <Radio.Content>
                            <Label>{t(lv)}</Label>
                        </Radio.Content>
                    </Radio>
                ))}
            </RadioGroup>

            {!isAuto && (
                <>
                    <Alert title={t("alert")} status="warning" />
                    <TextField>
                        <Label>{t("label")}</Label>
                        <Input
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            placeholder={t("placeholder")}
                        />
                    </TextField>
                </>
            )}
        </div>
    );
}
