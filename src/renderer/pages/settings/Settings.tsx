import type { UserConfig } from "@/main/conf/conf";
import { Alert, ScrollShadow, Tab, Tabs } from "@nextui-org/react";
import { NetworkTab } from "@pages/settings/NetworkTab";
import { PreferencesTab } from "@pages/settings/PreferencesTab";
import { ConfigContext as ConfigContext1, type ConfigContextContent } from "@pages/settings/use-config";
import { CodeIcon, GlobeIcon, type Icon, PaintbrushIcon, RocketIcon } from "@primer/octicons-react";
import React, { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStorage } from "react-use";

interface SettingsPage {
    id: string;
    icon: Icon;
    content: React.ComponentType;
}

const settingsTabs: SettingsPage[] = [
    {
        id: "pref",
        icon: PaintbrushIcon,
        content: PreferencesTab
    },
    {
        id: "launch",
        icon: RocketIcon,
        content: () => null
    },
    {
        id: "network",
        icon: GlobeIcon,
        content: NetworkTab
    },
    {
        id: "dev",
        icon: CodeIcon,
        content: () => null
    }
];

/**
 * The about page.
 */
export const Settings: FC = () => {
    const { t } = useTranslation("pages", { keyPrefix: "settings" });
    const [config, setConfig] = useState<UserConfig>();
    const [tab, setTab] = useSessionStorage("settings.tab", settingsTabs[0].id);

    useEffect(() => {
        native.conf.get().then(setConfig);
    }, []);

    useEffect(() => {
        if (config) {
            void native.conf.update(config);
        }
    }, [config]);


    if (!config) return;

    const context: ConfigContextContent = { config, setConfig };

    return <div className="flex flex-col w-full h-full justify-center items-center gap-8">
        <div className="grow flex flex-col basis-2/3 min-h-0 w-3/4 gap-4">
            <div className="w-full">
                <Alert
                    color="warning"
                    title={t("hint")}
                    description=""
                    classNames={{ title: "text-sm", base: "py-2" }}
                />
            </div>

            <div className="grow w-full flex flex-col min-h-0">
                <Tabs
                    isVertical
                    selectedKey={tab}
                    onSelectionChange={(s) => setTab(s.toString())}
                    classNames={{
                        wrapper: "h-full"
                    }}
                >
                    {
                        settingsTabs.map(({ id, icon, content }) => {
                            return <Tab
                                key={id}
                                className="w-full"
                                title={
                                    <div className="flex gap-2 items-center">
                                        {React.createElement(icon)}
                                        {t(`tabs.${id}`)}
                                    </div>
                                }
                            >
                                <ScrollShadow className="w-full h-full overflow-y-auto" size={10}>
                                    <div className="flex flex-col gap-6 w-full px-4 py-2">
                                        <ConfigContext1 value={context}>
                                            {React.createElement(content)}
                                        </ConfigContext1>
                                    </div>
                                </ScrollShadow>
                            </Tab>;
                        })
                    }
                </Tabs>
            </div>
        </div>
    </div>;
};

