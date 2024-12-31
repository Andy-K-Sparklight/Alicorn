import { FC } from "react";
import { useTranslation } from "react-i18next";

/**
 * The new homepage for Alicorn.
 */
export const Home: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "home" });
    return <div>
        <h1>{t("welcome-back")}</h1>
    </div>;
};