import { Card, CardBody } from "@nextui-org/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import pkg from "~/package.json";

export const PackagesInfo: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });

    return <>
        <h1 className="text-2xl font-bold mb-4">{t("packages-info")}</h1>
        <DependencyCountCard/>
    </>;
};

const DependencyCountCard = () => {
    const { dependencies, devDependencies } = pkg;
    const prodNames = Object.keys(dependencies).join(" ");
    const devNames = Object.keys(devDependencies).join(" ");

    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <Card className="w-full">
        <CardBody>
            <div className="whitespace-pre-line px-2">
                {t("deps", { prodNames, devNames })}
            </div>
        </CardBody>
    </Card>;
};