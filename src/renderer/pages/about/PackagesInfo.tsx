import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useTranslation } from "react-i18next";
import pkg from "~/package.json";

export function PackagesInfo() {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });

    return <>
        <h1 className="text-2xl font-bold mb-4">{t("packages-info")}</h1>
        <Packages/>
    </>;
}

function Packages() {
    const packages = Object.entries(pkg.dependencies);

    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <Table className="p-3" isHeaderSticky aria-label="Packages" classNames={{ base: "overflow-y-scroll" }}>
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
                        <TableCell><code>{name}</code></TableCell>
                        <TableCell><code>{version}</code></TableCell>
                    </TableRow>;
                })
            }
        </TableBody>
    </Table>;
}
