import { Button, Card } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { ArrowRightIcon, FileBadgeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import license from "~/LICENSE?raw";

export function LicenseView() {
    const { t } = useTranslation("setup", { keyPrefix: "license" });
    const next = useSetupNextPage();

    return (
        <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-4">
            <div className="w-full h-full flex flex-col items-center gap-4">
                <div>
                    <FileBadgeIcon size={64} />
                </div>

                <h1 className="font-bold text-2xl text-center">{t("title")}</h1>
                <p className="text-muted whitespace-pre-line text-center">{t("sub")}</p>

                <Card className="min-h-0 overflow-y-auto">
                    <Card.Content>
                        <pre className="px-4">{license}</pre>
                    </Card.Content>
                </Card>

                <div className="flex flex-col gap-4 items-center">
                    <div className="text-sm text-muted">{t("btn-hint")}</div>

                    <Button variant="primary" onPress={next}>
                        {t("btn")}
                        <ArrowRightIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
}
