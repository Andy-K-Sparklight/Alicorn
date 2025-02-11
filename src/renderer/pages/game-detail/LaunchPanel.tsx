import { Input } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import React from "react";
import { useTranslation } from "react-i18next";

export function LaunchPanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.launch" });
    const game = useCurrentGameProfile();

    function updateJRTExec(fp: string) {
        const ng = structuredClone(game);
        ng.launchHint.pref.alterJRTExec = fp;
        void native.game.update(ng);
    }

    return <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("alter-jrt.label")}</div>
                <div className="text-sm text-foreground-400">{t("alter-jrt.sub")}</div>
            </div>

            <Input value={game.launchHint.pref.alterJRTExec} onValueChange={updateJRTExec}/>
        </div>
    </div>;
}
