import { Button } from "@heroui/react";
import { ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNav } from "@/renderer/util/nav";

export function FinishView() {
    const { t } = useTranslation("setup", { keyPrefix: "finish" });
    const nav = useNav();

    function finishSetup() {
        nav("/");
        localStorage.setItem("setup.done", "1");
    }

    return (
        <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-4">
                <div>
                    <CheckCircleIcon size={64} />
                </div>

                <h1 className="font-bold text-3xl text-center">{t("title")}</h1>
                <p className="text-muted whitespace-pre-line text-center">{t("sub")}</p>
            </div>

            <Button variant="primary" className="shadow-md" onPress={finishSetup}>
                <ArrowRightIcon />
                {t("btn")}
            </Button>
        </div>
    );
}
