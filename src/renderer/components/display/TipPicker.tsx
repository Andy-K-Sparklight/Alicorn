import { useState } from "react";
import { useTranslation } from "react-i18next";

export function TipPicker({ tipKey }: { tipKey: string }) {
    const { t } = useTranslation("common", { keyPrefix: "tips" });
    const values = t(tipKey, { returnObjects: true }) as string[];
    const [index, _] = useState(Math.floor(Math.random() * values.length));

    return values[index];
}
