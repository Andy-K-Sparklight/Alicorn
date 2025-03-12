import type { GameProfile } from "@/main/game/spec";
import { alter } from "@/main/util/misc";
import { StringArrayInput } from "@components/StringArrayInput";
import { Input, Switch } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import React from "react";
import { useTranslation } from "react-i18next";

export function LaunchPanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.launch" });
    const game = useCurrentGameProfile();
    const isImported = game.installProps.type === "imported";

    function makeGameReducer<T>(update: (g: GameProfile, a: T) => void) {
        return (a: T) => {
            void native.game.update(alter(game, g => update(g, a)));
        };
    }

    return <div className="w-full h-full overflow-y-auto">
        <div className="px-4 py-2">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="grow flex flex-col gap-1">
                        <div className="font-bold text-lg">{t("alter-jrt.label")}</div>
                        <div className="text-sm text-foreground-400">{t("alter-jrt.sub")}</div>
                    </div>

                    <Input
                        defaultValue={game.launchHint.pref.alterJRTExec}
                        onBlur={e => makeGameReducer<string>((g, fp) => g.launchHint.pref.alterJRTExec = fp)(e.target.value)}
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

                {
                    !isImported &&
                    <div className="grow flex flex-col gap-1">
                        <div className="font-bold text-lg">{t("venv.label")}</div>

                        <div className="flex gap-2 items-center">
                            <Switch
                                size="sm"
                                isSelected={game.launchHint.venv}
                                onValueChange={makeGameReducer<boolean>((g, b) => g.launchHint.venv = b)}
                            />
                            <div className="text-sm text-foreground-400 whitespace-pre-line">{t("venv.sub")}</div>
                        </div>
                    </div>
                }
            </div>
        </div>
    </div>;
}
