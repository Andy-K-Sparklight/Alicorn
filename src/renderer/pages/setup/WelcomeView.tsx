import { useNav } from "@/renderer/util/nav";
import logoLegacy from "@assets/logo-legacy.png";
import logo from "@assets/logo.png";
import { ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function WelcomeView() {
    const { t } = useTranslation("setup", { keyPrefix: "welcome" });
    const nav = useNav();

    function nextPage() {
        nav("/setup/zoom");
    }

    return <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-4" onClick={nextPage}>
        <div className="w-full flex items-center gap-6 grow">
            <div className="flex gap-10 h-24 items-center">
                <img className="w-full h-full object-contain" alt="Legacy Logo" src={logoLegacy}/>
                <div className="text-foreground-400">
                    <ChevronsRight size={36}/>
                </div>
                <img className="w-full h-full object-contain" alt="Logo" src={logo}/>
            </div>

            <div className="flex flex-col gap-8 items-center grow">
                <h1 className="font-bold text-3xl">{t("title")}</h1>
                <p className="text-foreground-400 whitespace-pre-line text-center">
                    {t("sub")}
                </p>
            </div>
        </div>

        {import.meta.env.AL_DEV && <div className="text-warning">{t("is-dev")}</div>}
        <div className="animate-pulse">{t("continue")}</div>
    </div>;
}
