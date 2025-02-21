import { i18n } from "@/renderer/i18n/i18n";
import { useNav } from "@/renderer/util/nav";
import logo from "@assets/logo.png";
import { Button, Divider } from "@heroui/react";
import { useTranslation } from "react-i18next";

export function LanguageView() {
    const { t } = useTranslation("setup", { keyPrefix: "lang" });
    const nav = useNav();

    function setLang(lang: string) {
        void i18n.alterLanguage(lang);
        nav("/setup/welcome");
    }

    return <div className="w-2/3 mx-auto h-full flex flex-col justify-center gap-10">
        <div className="h-16 flex items-center justify-center gap-10">
            <img className="h-full object-contain" alt="Logo" src={logo}/>
            <div className="font-bold text-5xl">Alicorn</div>
        </div>

        <Divider className="w-2/3 mx-auto"/>

        <div className="w-2/3 mx-auto flex flex-col justify-center gap-4">
            {
                i18n.getAvailableLanguages().map(lang =>
                    <Button key={lang} variant="light" size="lg" onPress={() => setLang(lang)}>
                    <span className="font-bold text-xl">
                       {t(lang)}
                    </span>
                    </Button>
                )
            }
        </div>
    </div>;
}
