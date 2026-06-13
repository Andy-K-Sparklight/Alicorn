import logo from "@assets/logo.png";
import { Alert, Button, ButtonGroup, Card } from "@heroui/react";
import { FileBadgeIcon, FolderGit2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import pkg from "~/package.json";

export function AppInfo() {
    const { t } = useTranslation("pages", { keyPrefix: "about.subtitles" });
    return (
        <>
            <h1 className="text-2xl font-bold mb-4">{t("app-info")}</h1>
            <VersionCard />
            {import.meta.env.AL_DEV && <DevNoteCard />}
            <CopyrightCard />
            <AppLinks />
        </>
    );
}

function VersionCard() {
    const { t } = useTranslation("pages", { keyPrefix: "about" });
    const version = `"${pkg.codename}" ${pkg.version}`;

    return (
        <Card className="w-full">
            <Card.Content>
                <div className="flex items-center gap-4 h-12">
                    <img className="h-full" alt="Alicorn Logo" src={logo} />
                    <div className="flex flex-col grow">
                        <p className="text-lg font-bold">{t("name")}</p>
                        <p className="text-sm text-muted">{t("version", { version })}</p>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}

function DevNoteCard() {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return (
        <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>{t("dev-note.title")}</Alert.Title>
                <Alert.Description>{t("dev-note.body")}</Alert.Description>
            </Alert.Content>
        </Alert>
    );
}

function CopyrightCard() {
    const { t } = useTranslation("pages", { keyPrefix: "about" });

    return (
        <Card className="w-full">
            <Card.Content>
                <div className="whitespace-pre-line px-2 text-muted text-sm">{t("copyright")}</div>
            </Card.Content>
        </Card>
    );
}

const SRC_URL = "https://github.com/Andy-K-Sparklight/Alicorn";
const LICENSE_URL = "https://www.gnu.org/licenses/gpl-3.0.html";

function AppLinks() {
    const { t } = useTranslation("pages", { keyPrefix: "about.links" });

    return (
        <ButtonGroup>
            <Button onPress={() => native.ext.openURL(SRC_URL)}>
                <FolderGit2 />
                {t("source")}
            </Button>
            <Button onPress={() => native.ext.openURL(LICENSE_URL)}>
                <ButtonGroup.Separator />
                <FileBadgeIcon />
                {t("license")}
            </Button>
        </ButtonGroup>
    );
}
