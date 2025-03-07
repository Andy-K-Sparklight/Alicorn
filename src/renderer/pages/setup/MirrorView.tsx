import { useConfig } from "@/renderer/store/conf";
import { Radio, RadioGroup } from "@heroui/radio";
import { Button, Link } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { ArrowRightIcon, GaugeIcon } from "lucide-react";
import React, { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

export function MirrorView() {
    const { t } = useTranslation("setup", { keyPrefix: "mirror" });
    const { config, alterConfig } = useConfig();
    const next = useSetupNextPage();

    function showLink() {
        native.ext.openURL("https://bmclapidoc.bangbang93.com");
    }

    useEffect(() => {
        if (!import.meta.env.AL_ENABLE_BMCLAPI) {
            next();
        }
    }, []);

    if (!config) return null;

    return <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-4">
        <div className="w-full h-full flex items-center justify-evenly gap-10">
            <div className="flex flex-col items-center gap-4">
                <div>
                    <GaugeIcon size={64}/>
                </div>

                <h1 className="font-bold text-2xl text-center">{t("title")}</h1>
                <p className="text-foreground-400 whitespace-pre-line text-center">
                    {t("sub")}
                </p>
            </div>

            <div className="flex flex-col justify-center gap-4">
                <RadioGroup
                    value={config.net.mirror.enable ? "allow" : "disallow"}
                    onValueChange={v => alterConfig(c => c.net.mirror.enable = v === "allow")}
                >
                    <Radio value="allow" description={t("allow.sub")}>{t("allow.label")}</Radio>
                    <Radio value="disallow" description={t("disallow.sub")}>{t("disallow.label")}</Radio>
                </RadioGroup>
            </div>
        </div>

        <p className="text-foreground-400 text-sm whitespace-pre-line text-center">
            <Trans
                t={t}
                i18nKey="footer"
                components={[<Link className="text-sm" onPress={showLink}/>]}
            />
        </p>

        <div>
            <Button color="primary" onPress={next} startContent={<ArrowRightIcon/>}>{t("btn")}</Button>
        </div>
    </div>;
}
