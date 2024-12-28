import { useTranslation } from "react-i18next";
import pkg from "~/package.json";
import { Button, ButtonGroup, Card, CardBody, Image } from "@nextui-org/react";
import { AlertIcon, FileBadgeIcon, MarkGithubIcon } from "@primer/octicons-react";

export const AppInfoPage = () => {
    return <div className="m-auto flex flex-col justify-center items-center w-3/4 gap-4">
        <VersionCard/>
        {import.meta.env.AL_DEV && <DevNoteCard/>}
        <CopyrightCard/>
        <LinksCard/>
    </div>;
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
                    src="logo.png"
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

    return <Card className="w-full">
        <CardBody>
            <div className="flex gap-4 px-2 items-center text-warning">
                <AlertIcon/>
                <div className="whitespace-pre-line">
                    {t("dev-note")}
                </div>
            </div>
        </CardBody>
    </Card>;
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

const LinksCard = () => {
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