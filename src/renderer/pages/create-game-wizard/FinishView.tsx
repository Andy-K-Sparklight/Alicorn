import { remoteInstaller } from "@/renderer/services/install";
import { useNav } from "@/renderer/util/nav";
import { WizardCard } from "@components/display/WizardCard";
import { Button } from "@heroui/react";
import { useCreateGameWizardContext } from "@pages/create-game-wizard/CreateGameWizardView";
import { ArrowRightIcon, CheckIcon, PlayCircleIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function FinishView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game-wizard.finish" });
    const { t: tc } = useTranslation("pages", { keyPrefix: "create-game" });
    const ctx = useCreateGameWizardContext();
    const nav = useNav();

    async function finalize(install: boolean) {
        const gid = await native.game.add({
            name: tc("default-name"),
            containerId: undefined,
            accountId: ctx.value.accountId ?? "",
            authType: ctx.value.authType ?? "online",
            gameVersion: ctx.value.gameVersion!,
            assetsLevel: "full",
            installProps: {
                type: ctx.value.installProps!.type,
                profileId: "",
                gameVersion: ctx.value.gameVersion!,
                loaderVersion: ""
            },
            playerName: "",
            containerShouldLink: true
        });

        if (install) {
            void remoteInstaller.install(gid);
        }

        nav("/games");
    }

    return <WizardCard
        title={t("title")}
        sub={t("sub")}
        content={
            <div className="flex flex-col h-full gap-4">
                <div className="mt-auto flex flex-col gap-2">
                    <Button
                        fullWidth
                        startContent={<PlayCircleIcon/>}
                        color="primary"
                        onPress={() => finalize(true)}
                    >
                        {t("btn.install")}
                    </Button>

                    <Button
                        fullWidth
                        startContent={<ArrowRightIcon/>}
                        onPress={() => finalize(false)}
                    >
                        {t("btn.create-only")}
                    </Button>
                </div>
            </div>
        }
    >
        <div className="w-full h-full flex flex-col gap-6 items-center justify-center">
            <CheckIcon size={96}/>
            {tc("default-name")} / {ctx.value.gameVersion}
        </div>
    </WizardCard>;
}
