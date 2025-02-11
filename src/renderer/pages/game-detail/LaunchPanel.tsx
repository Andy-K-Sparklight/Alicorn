import type { GameProfile } from "@/main/game/spec";
import { StringArrayInput } from "@components/StringArrayInput";
import { Input } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import React from "react";
import { useTranslation } from "react-i18next";

export function LaunchPanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.launch" });
    const game = useCurrentGameProfile();

    function makeGameReducer<T>(update: (g: GameProfile, a: T) => void) {
        return (a: T) => {
            const ng = structuredClone(game);
            update(ng, a);
            void native.game.update(ng);
        };
    }

    return <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("alter-jrt.label")}</div>
                <div className="text-sm text-foreground-400">{t("alter-jrt.sub")}</div>
            </div>

            <Input
                value={game.launchHint.pref.alterJRTExec}
                onValueChange={makeGameReducer((g, fp) => g.launchHint.pref.alterJRTExec = fp)}
            />
        </div>

        <div className="flex flex-col gap-2">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("vm-args.label")}</div>
                <div className="text-sm text-foreground-400">{t("vm-args.sub")}</div>
            </div>

            <StringArrayInput
                value={game.launchHint.pref.args?.vm ?? []}
                onChange={
                    makeGameReducer((g, fp) => {
                        if (!g.launchHint.pref.args) {
                            g.launchHint.pref.args = { vm: [], game: [] };
                        }
                        g.launchHint.pref.args.vm = fp;
                    })
                }
            />
        </div>

        <div className="flex flex-col gap-2">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("game-args.label")}</div>
                <div className="text-sm text-foreground-400">{t("game-args.sub")}</div>
            </div>

            <StringArrayInput
                value={game.launchHint.pref.args?.game ?? []}
                onChange={
                    makeGameReducer((g, fp) => {
                        if (!g.launchHint.pref.args) {
                            g.launchHint.pref.args = { vm: [], game: [] };
                        }
                        g.launchHint.pref.args.game = fp;
                    })
                }
            />
        </div>
    </div>;
}
