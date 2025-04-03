import { Alert } from "@components/display/Alert";
import { Button, cn, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import { ArrowRightIcon, CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeaturesInfo() {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });

    return <>
        <h1 className="text-2xl font-bold mb-4">{t("features-info")}</h1>
        <RebuildNote/>
        <FeaturesTable/>
    </>;
}

const BUILDING_URL = "https://github.com/Andy-K-Sparklight/Alicorn#build-instructions";

function RebuildNote() {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <div className="w-full">
        <Alert
            title={t("rebuild-note")}

            endContent={
                <Button startContent={<ArrowRightIcon/>} onPress={() => native.ext.openURL(BUILDING_URL)}>
                    {t("rebuild-how")}
                </Button>
            }
        />
    </div>;
}

const FEATURES = {
    bmclapi: import.meta.env.AL_ENABLE_BMCLAPI,
    "lzma-native": import.meta.env.AL_ENABLE_NATIVE_LZMA
};


function FeaturesTable() {
    return <Table hideHeader aria-label="Features" classNames={{ td: "text-medium" }}>
        <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Availability</TableColumn>
        </TableHeader>
        <TableBody>
            {
                Object.entries(FEATURES).map(([name, available]) =>
                    <TableRow key={name}>
                        <TableCell>
                            <PackageName name={name}/>
                        </TableCell>
                        <TableCell>
                            <Availability available={available}/>
                        </TableCell>
                    </TableRow>)
            }
        </TableBody>
    </Table>;
}

function PackageName({ name }: { name: string }) {
    const { t } = useTranslation("pages", { keyPrefix: "about.features" });

    return <div className="flex items-center gap-2">
        {t(`${name}.name`)}
        <Tooltip
            placement="right"
            color="foreground"
            content={<div className="whitespace-pre-line">{t(`${name}.tip`)}</div>}
        >
            <InfoIcon className="text-foreground-400"/>
        </Tooltip>
    </div>;
}

function Availability({ available }: { available: boolean }) {
    const { t } = useTranslation("pages", { keyPrefix: "about.features" });

    return <div
        className={cn("flex items-center gap-2",
            {
                "text-success": available,
                "text-warning": !available
            }
        )}
    >
        {available ? <CheckIcon/> : <XIcon/>}
        {t(available ? "enabled" : "disabled")}
    </div>;
}
