import { Alert } from "@components/display/Alert";
import { Button, cn, Table, Tooltip } from "@heroui/react";
import { ArrowRightIcon, CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeaturesInfo() {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });

    return (
        <>
            <h1 className="text-2xl font-bold mb-4">{t("features-info")}</h1>
            <RebuildNote />
            <FeaturesTable />
        </>
    );
}

const BUILDING_URL = "https://github.com/Andy-K-Sparklight/Alicorn#build-instructions";

function RebuildNote() {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return (
        <div className="w-full">
            <Alert
                title={t("rebuild-note")}
                endContent={
                    <Button
                        variant="tertiary"
                        size="sm"
                        onPress={() => native.ext.openURL(BUILDING_URL)}
                    >
                        <ArrowRightIcon />
                        {t("rebuild-how")}
                    </Button>
                }
            />
        </div>
    );
}

const FEATURES = {
    bmclapi: import.meta.env.AL_ENABLE_BMCLAPI,
    "lzma-native": import.meta.env.AL_ENABLE_NATIVE_LZMA,
};

function FeaturesTable() {
    return (
        <Table variant="secondary">
            <Table.Content>
                <Table.Header className="sr-only">
                    <Table.Column id="name" isRowHeader>
                        Name
                    </Table.Column>
                    <Table.Column id="availability">Availability</Table.Column>
                </Table.Header>
                <Table.Body>
                    {Object.entries(FEATURES).map(([name, available]) => (
                        <Table.Row key={name} id={name}>
                            <Table.Cell className="text-base">
                                <PackageName name={name} />
                            </Table.Cell>
                            <Table.Cell className="text-base">
                                <Availability available={available} />
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Content>
        </Table>
    );
}

function PackageName({ name }: { name: string }) {
    const { t } = useTranslation("pages", { keyPrefix: "about.features" });

    return (
        <div className="flex items-center gap-2">
            {t(`${name}.name`)}
            <Tooltip delay={0}>
                <Tooltip.Trigger>
                    <InfoIcon className="text-muted" />
                </Tooltip.Trigger>
                <Tooltip.Content placement="right">
                    <div className="whitespace-pre-line">{t(`${name}.tip`)}</div>
                </Tooltip.Content>
            </Tooltip>
        </div>
    );
}

function Availability({ available }: { available: boolean }) {
    const { t } = useTranslation("pages", { keyPrefix: "about.features" });

    return (
        <div
            className={cn("flex items-center gap-2", {
                "text-success": available,
                "text-warning": !available,
            })}
        >
            {available ? <CheckIcon /> : <XIcon />}
            {t(available ? "enabled" : "disabled")}
        </div>
    );
}
