import { useConfig } from "@/renderer/services/conf";

import { DirInput } from "@components/input/DirInput";
import { Button } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { CheckIcon, PackageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function GamePathSetupView() {
    const { t } = useTranslation("setup", { keyPrefix: "game-path" });
    const { config, alterConfig } = useConfig();
    const next = useSetupNextPage();

    if (!config) return null;

    return <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
            <div>
                <PackageIcon size={64}/>
            </div>
            <h1 className="font-bold text-2xl text-center">
                {t("title")}
            </h1>
            <p className="text-foreground-400 whitespace-pre-line text-center">
                {t("sub")}
            </p>
        </div>

        <div className="w-5/6 mx-auto">
            <DirInput value={config.paths.game} onChange={v => alterConfig(c => c.paths.game = v)}/>
        </div>

        <Button color="primary" startContent={<CheckIcon/>} onPress={next}>{t("btn")}</Button>
    </div>;
}
