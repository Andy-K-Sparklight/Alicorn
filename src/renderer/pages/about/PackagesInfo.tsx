import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
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
    const packages = Object.entries(pkg.dependencies);

    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <Table isHeaderSticky classNames={{ base: "overflow-y-scroll" }}>
        <TableHeader>
            <TableColumn>
                {t("packages.name")}
            </TableColumn>
            <TableColumn>
                {t("packages.ver")}
            </TableColumn>
        </TableHeader>
        <TableBody>
            {
                packages.map(([name, version]) => {
                    return <TableRow key={name}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{version}</TableCell>
                    </TableRow>;
                })
            }
        </TableBody>
    </Table>;
};