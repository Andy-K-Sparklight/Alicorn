import { Button, Input } from "@heroui/react";
import { PlusIcon, XIcon } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface StringArrayInputProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export function StringArrayInput({ value, onChange }: StringArrayInputProps) {
    const { t } = useTranslation("common", { keyPrefix: "input.string-array" });
    const [str, setStr] = useState("");

    function addItem() {
        const s = str.trim();
        if (s) {
            const d = [...value, s];
            onChange(d);
            setStr("");
        }
    }

    function removeItem(i: number) {
        const d = value.slice(0, i).concat(value.slice(i + 1));
        onChange(d);
    }

    return <div className="flex flex-col gap-2">
        {
            value.map((s, i) =>
                <div key={i} className="mt-2 flex items-center gap-2">
                    <div
                        className="cursor-pointer"
                        onClick={() => removeItem(i)}
                    >
                        <XIcon className="text-foreground-400"/>
                    </div>

                    <div className="text-sm">
                        {s}
                    </div>
                </div>
            )
        }

        <div className="flex items-center gap-1 mt-2">
            <Input fullWidth value={str} onValueChange={setStr} onBlur={addItem}/>
            <Button isIconOnly onPress={addItem}>
                <PlusIcon/>
            </Button>
        </div>

        {
            str &&
            <div className="text-sm text-secondary">{t("blur-to-add")}</div>
        }
    </div>;
}
