import { Alert } from "@components/display/Alert";
import { Radio, RadioGroup } from "@heroui/radio";
import { Input } from "@heroui/react";
import React, { useState } from "react";
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

    return <div className="p-4 border-solid border-2 border-foreground-400 rounded-xl flex flex-col gap-4">
        <div className="font-bold text-medium">{t("title")}</div>

        <RadioGroup
            value={isAuto ? "auto" : "manual"}
            color={isAuto ? "primary" : "warning"}
            onValueChange={handleSelectionChange}
        >
            {
                ["auto", "manual"].map(lv =>
                    <Radio key={lv} value={lv}>{t(lv)}</Radio>
                )
            }
        </RadioGroup>

        {
            !isAuto &&
            <>
                <Alert title={t("alert")} color="warning"/>
                <Input value={value} onValueChange={onChange} label={t("label")} placeholder={t("placeholder")}/>
            </>
        }
    </div>;
}
