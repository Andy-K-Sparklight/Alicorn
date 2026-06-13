import { Button, Description, Label, Switch } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { ArrowRightIcon, BanIcon, HandHelpingIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfig } from "@/renderer/services/conf";

export function AnalyticsView() {
    const { t } = useTranslation("setup", { keyPrefix: "analytics" });
    const { config, alterConfig } = useConfig();
    const next = useSetupNextPage();

    if (!config) return;

    const allDisabled = !(
        config.analytics.crashReports ||
        config.analytics.performanceReports ||
        config.analytics.ping
    );

    return (
        <div className="flex flex-col w-full h-full mx-auto items-center">
            <div className="grow flex w-full items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                    <div>
                        <HandHelpingIcon size={64} />
                    </div>

                    <h1 className="font-bold text-3xl text-center">{t("title")}</h1>
                    <p className="text-muted whitespace-pre-line text-center">{t("sub")}</p>
                </div>

                <div className="flex flex-col gap-4">
                    <Switch
                        isSelected={config.analytics.crashReports}
                        onChange={v => alterConfig(c => (c.analytics.crashReports = v))}
                    >
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <SwitchLabel
                            title={t("options.crash.label")}
                            sub={t("options.crash.sub")}
                        />
                    </Switch>

                    <Switch
                        isSelected={config.analytics.performanceReports}
                        onChange={v => alterConfig(c => (c.analytics.performanceReports = v))}
                    >
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <SwitchLabel
                            title={t("options.performance.label")}
                            sub={t("options.performance.sub")}
                        />
                    </Switch>

                    <Switch
                        isSelected={config.analytics.ping}
                        onChange={v => alterConfig(c => (c.analytics.ping = v))}
                    >
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <SwitchLabel title={t("options.ping.label")} sub={t("options.ping.sub")} />
                    </Switch>
                </div>
            </div>

            <div>
                <Button variant={allDisabled ? "secondary" : "primary"} onPress={next}>
                    {allDisabled ? <BanIcon /> : <ArrowRightIcon />}
                    {t(allDisabled ? "btn-none" : "btn")}
                </Button>
            </div>

            <div className="text-sm text-muted mt-10 whitespace-pre-line text-center">
                {t(allDisabled ? "warranty-none" : "warranty")}
            </div>
        </div>
    );
}

function SwitchLabel({ title, sub }: { title: string; sub: string }) {
    return (
        <Switch.Content className="ml-2 text-base flex flex-col gap-1">
            <Label>{title}</Label>
            <Description className="text-sm whitespace-pre-line">{sub}</Description>
        </Switch.Content>
    );
}
