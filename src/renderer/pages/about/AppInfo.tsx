import logo from "@assets/logo.png";
import { Alert, Button, ButtonGroup, Card, CardBody, Image } from "@heroui/react";
import { FileBadgeIcon, MarkGithubIcon } from "@primer/octicons-react";
import { useTranslation } from "react-i18next";
import pkg from "~/package.json";

export const AppInfo = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });
    return <>
        <h1 className="text-2xl font-bold mb-4">{t("app-info")}</h1>
        <VersionCard/>
        {import.meta.env.AL_DEV && <DevNoteCard/>}
        <CopyrightCard/>
        <AppLinks/>
    </>;
};

const VersionCard = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about" });
    const version = `"${pkg.codename}" ${pkg.version}`;

    return <Card className="w-full">
        <CardBody>
            <div className="flex items-center gap-4 h-12">
                <Image
                    removeWrapper
                    className="h-full"
                    alt="Alicorn Logo"
                    src={logo}
                />
                <div className="flex flex-col grow">
                    <p className="text-xl font-bold">{t("name")}</p>
                    <p className="text-md text-foreground-400">
                        {t("version", { version })}
                    </p>
                </div>
            </div>
        </CardBody>
    </Card>;
};

const DevNoteCard = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <div className="w-full">
        <Alert
            color="warning"
            title={t("dev-note")}
            description=""
            classNames={{ title: "font-bold" }}
        />
    </div>;
};

const CopyrightCard = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return <Card className="w-full">
        <CardBody>
            <div className="whitespace-pre-line px-2">
                {t("copyright")}
            </div>
        </CardBody>
    </Card>;
};

const SRC_URL = "https://github.com/Andy-K-Sparklight/Alicorn";
const LICENSE_URL = "https://www.gnu.org/licenses/gpl-3.0.html";

const AppLinks = () => {
    const { t } = useTranslation("pages", { keyPrefix: "about.links" });

    return <ButtonGroup>
        <Button
            onPress={() => native.ext.openURL(SRC_URL)}
            startContent={<MarkGithubIcon/>}
        >
            {t("source")}
        </Button>
        <Button
            onPress={() => native.ext.openURL(LICENSE_URL)}
            startContent={<FileBadgeIcon/>}
        >
            {t("license")}
        </Button>
    </ButtonGroup>;
};