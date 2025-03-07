import { useConfig } from "@/renderer/store/conf";
import { Button, Switch } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { ArrowRightIcon, BanIcon, HandHelpingIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function AnalyticsView() {
    const { t } = useTranslation("setup", { keyPrefix: "analytics" });
    const { config, alterConfig } = useConfig();
    const next = useSetupNextPage();

    if (!config) return;

    const allDisabled = !(config.analytics.crashReports || config.analytics.performanceReports || config.analytics.ping);

    return <div className="flex flex-col w-full h-full mx-auto items-center">
        <div className="grow flex w-full items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-4">
                <div>
                    <HandHelpingIcon size={64}/>
                </div>

                <h1 className="font-bold text-3xl text-center">
                    {t("title")}
                </h1>
                <p className="text-foreground-400 whitespace-pre-line text-center">
                    {t("sub")}
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <Switch
                    isSelected={config.analytics.crashReports}
                    onValueChange={v => alterConfig(c => c.analytics.crashReports = v)}
                >
                    <SwitchLabel title={t("options.crash.label")} sub={t("options.crash.sub")}/>
                </Switch>

                <Switch
                    isSelected={config.analytics.performanceReports}
                    onValueChange={v => alterConfig(c => c.analytics.performanceReports = v)}
                >
                    <SwitchLabel title={t("options.performance.label")} sub={t("options.performance.sub")}/>
                </Switch>

                <Switch
                    isSelected={config.analytics.ping}
                    onValueChange={v => alterConfig(c => c.analytics.ping = v)}
                >
                    <SwitchLabel title={t("options.ping.label")} sub={t("options.ping.sub")}/>
                </Switch>
            </div>
        </div>

        <div>
            <Button
                color={allDisabled ? "default" : "primary"}
                startContent={allDisabled ? <BanIcon/> : <ArrowRightIcon/>}
                onPress={next}
            >
                {t(allDisabled ? "btn-none" : "btn")}
            </Button>
        </div>

        <div className="text-sm text-foreground-400 mt-10 whitespace-pre-line text-center">
            {t(allDisabled ? "warranty-none" : "warranty")}
        </div>
    </div>;
}

function SwitchLabel({ title, sub }: { title: string; sub: string }) {
    return <div className="ml-2 text-medium flex flex-col gap-1">
        {title}
        <div className="text-foreground-400 text-sm whitespace-pre-line">{sub}</div>
    </div>;
}
