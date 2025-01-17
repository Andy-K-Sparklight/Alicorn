import { Alert, Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import { ArrowRightIcon, CheckIcon, InfoIcon, XIcon } from "@primer/octicons-react";
import { clsx } from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";

export const FeaturesInfo: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });

    return <>
        <h1 className="text-2xl font-bold mb-4">{t("features-info")}</h1>
        <FeaturesNoteCard/>
        <FeaturesTable/>
    </>;
};

const BUILDING_URL = "https://github.com/Andy-K-Sparklight/Alicorn#build-instructions";

const FeaturesNoteCard = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <div className="w-full">
        <Alert title={t("features-note")}
               description=""
               classNames={{ title: "text-md" }}
               endContent={
                   <Button onPress={() => native.ext.openURL(BUILDING_URL)}>
                       <div className="flex items-center gap-2">
                           <ArrowRightIcon/>
                           {t("features-how")}
                       </div>
                   </Button>
               }
        />
    </div>;
};

const FeaturesTable = () => {
    const features = getFeatures();

    const { t } = useTranslation("pages", { keyPrefix: "about.features" });

    function createRow(name: string, available: boolean) {
        return <TableRow key={name}>
            <TableCell>
                <div className="flex items-center gap-2">
                    {t(`${name}.name`)}
                    <Tooltip placement="right"
                             color="foreground"
                             content={<div className="whitespace-pre-line">{t(`${name}.tip`)}</div>}
                    >
                        <InfoIcon className="text-foreground-400"/>
                    </Tooltip>
                </div>
            </TableCell>
            <TableCell>
                <div className={clsx("flex items-center gap-2",
                    {
                        "text-success": available,
                        "text-warning": !available
                    }
                )}>
                    {available ? <CheckIcon/> : <XIcon/>}
                    {t(available ? "enabled" : "disabled")}
                </div>
            </TableCell>
        </TableRow>;
    }

    return <Table hideHeader aria-label="Features Availability Table" classNames={{ td: "text-medium" }}>
        <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Availability</TableColumn>
        </TableHeader>
        <TableBody>
            {Object.entries(features).map(([name, available]) => createRow(name, available))}
        </TableBody>
    </Table>;
};

function getFeatures(): Record<string, boolean> {
    return {
        bmclapi: import.meta.env.AL_ENABLE_BMCLAPI,
        "local-account": import.meta.env.AL_ENABLE_LOCAL_ACCOUNT,
        aria2: import.meta.env.AL_ENABLE_BUNDLED_ARIA2,
        "lzma-native": import.meta.env.AL_ENABLE_NATIVE_LZMA
    };
}