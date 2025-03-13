import { Input } from "@heroui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PlayerNameInputProps {
    onChange: (value: string) => void;
}

export function PlayerNameInput({ onChange }: PlayerNameInputProps) {
    const { t } = useTranslation("common", { keyPrefix: "input.player-name" });
    const [internalValue, setInternalValue] = useState("");

    function validate(s: string) {
        return /[0-9A-Z_]{3,16}/i.test(s);
    }

    const isValid = validate(internalValue);

    function handleValueChange(s: string) {
        setInternalValue(s);
        if (!s) {
            onChange("Player");
        } else {
            if (validate(s)) {
                onChange(s);
            } else {
                onChange("");
            }
        }
    }

    return <Input
        errorMessage={t("hint")}
        placeholder="Player"
        isInvalid={!isValid && internalValue.length > 0} // Do not let the box become red by default
        value={internalValue}
        onValueChange={handleValueChange}
        label={t("label")}
    />;
}
