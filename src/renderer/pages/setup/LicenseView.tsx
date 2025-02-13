import { useNav } from "@/renderer/util/nav";
import { ConfirmPopup } from "@components/ConfirmPopup";
import { Button, Card, CardBody } from "@heroui/react";
import { CircleCheckIcon, FileBadgeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import license from "~/LICENSE?raw";

export function LicenseView() {
    const { t } = useTranslation("setup", { keyPrefix: "license" });
    const nav = useNav();

    function nextPage() {
        nav("/game-path");
    }

    return <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-4">
        <div className="w-full h-full flex flex-col items-center gap-4">
            <div>
                <FileBadgeIcon size={64}/>
            </div>

            <h1 className="font-bold text-2xl text-center">{t("title")}</h1>
            <p className="text-foreground-400 whitespace-pre-line text-center">
                {t("sub")}
            </p>

            <Card>
                <CardBody>
                    <pre className="px-4">
                        {license}
                    </pre>
                </CardBody>
            </Card>

            <div className="flex flex-col gap-2 items-center">
                <div className="text-sm text-default-400">{t("btn-hint")}</div>
                <ConfirmPopup
                    title={t("confirm.title")}
                    sub={t("confirm.sub")}
                    btnText={t("confirm.btn")}
                    color="primary"
                    onConfirm={nextPage}
                >
                    <Button color="primary" startContent={<CircleCheckIcon/>}>{t("btn")}</Button>
                </ConfirmPopup>
            </div>
        </div>
    </div>;
}
