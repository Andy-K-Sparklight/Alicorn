import { useNav } from "@/renderer/util/nav";
import { WizardCard } from "@components/WizardCard";
import { Button, Link } from "@heroui/react";
import { useCreateGameWizardContext } from "@pages/create-game-wizard/CreateGameWizardView";
import { ModLoaderSelector } from "@pages/create-game/ModLoaderSelector";
import { CheckIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

export function PickModLoaderView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game-wizard.pick-mod-loader" });
    const ctx = useCreateGameWizardContext();
    const nav = useNav();

    const gameVersion = ctx.value.gameVersion;
    const [availableModLoaders, setAvailableModLoaders] = useState<string[] | null>(null);

    const [loader, setLoader] = useState("vanilla");

    useEffect(() => {
        if (gameVersion) {
            setAvailableModLoaders(null);
            native.install.queryAvailableModLoaders(gameVersion).then(setAvailableModLoaders);
        } else {
            setAvailableModLoaders([]);
        }
    }, [gameVersion]);

    if (!gameVersion) {
        nav("/games/new-wizard/pick-version");
        return null;
    }

    function onConfirm() {
        ctx.setValue({ ...ctx.value, installProps: { type: loader as any, gameVersion: gameVersion! } });
        nav("/games/new-wizard/finish");
    }


    function selectVanilla() {
        setLoader("vanilla");
    }

    return <WizardCard
        title={t("title")}
        sub={t("sub")}
        content={
            <div className="flex flex-col gap-2 h-full">
                <div className="text-sm text-foreground-500">
                    <Trans
                        t={t}
                        i18nKey="hint"
                        components={[
                            <Link className="text-sm" onPress={selectVanilla}/>
                        ]}
                    />
                </div>

                <div className="mt-auto">
                    <Button
                        fullWidth
                        startContent={<CheckIcon/>}
                        onPress={onConfirm}
                        color="primary"
                    >
                        {t("btn")}
                    </Button>
                </div>
            </div>
        }
    >
        <div className="flex flex-col w-full h-full gap-2 justify-center">
            <ModLoaderSelector availableModLoaders={availableModLoaders} value={loader} onChange={setLoader}/>
        </div>
    </WizardCard>;
}
