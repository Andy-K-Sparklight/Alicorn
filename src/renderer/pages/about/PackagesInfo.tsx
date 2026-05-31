import { Table } from "@heroui/react";
import { useTranslation } from "react-i18next";
import pkg from "~/package.json";

export function PackagesInfo() {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });

    return (
        <>
            <h1 className="text-2xl font-bold">{t("packages-info")}</h1>
            <Packages />
        </>
    );
}

function Packages() {
    const packages = Object.entries(pkg.dependencies);

    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return (
        <>
            <p className="text-sm text-muted">{t("packages.credit")}</p>
            <Table className="p-3 min-h-0">
                <Table.ScrollContainer>
                    <Table.Content>
                        <Table.Header className="sticky top-0 z-1">
                            <Table.Column id="name" isRowHeader>
                                {t("packages.name")}
                            </Table.Column>
                            <Table.Column id="version">{t("packages.ver")}</Table.Column>
                        </Table.Header>
                        <Table.Body className="overflow-auto">
                            {packages.map(([name, version]) => {
                                return (
                                    <Table.Row key={name} id={name}>
                                        <Table.Cell>
                                            <code>{name}</code>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <code>{version}</code>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        </>
    );
}
