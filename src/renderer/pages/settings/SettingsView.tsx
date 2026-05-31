import { Alert } from "@components/display/Alert";
import { Tabs } from "@heroui/react";
import { DevTab } from "@pages/settings/DevTab";
import { LaunchTab } from "@pages/settings/LaunchTab";
import { NetworkTab } from "@pages/settings/NetworkTab";
import { PreferencesTab } from "@pages/settings/PreferencesTab";
import { PrivacyTab } from "@pages/settings/PrivacyTab";
import { StorageTab } from "@pages/settings/StorageTab";
import { BrushIcon, CodeXmlIcon, DatabaseIcon, LockIcon, RocketIcon, WifiIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage, useSessionStorage } from "react-use";

interface SettingsPage {
    id: string;
    icon: React.ComponentType;
    content: React.ComponentType;
}

const settingsTabs: SettingsPage[] = [
    {
        id: "pref",
        icon: BrushIcon,
        content: PreferencesTab,
    },
    {
        id: "launch",
        icon: RocketIcon,
        content: LaunchTab,
    },
    {
        id: "storage",
        icon: DatabaseIcon,
        content: StorageTab,
    },
    {
        id: "network",
        icon: WifiIcon,
        content: NetworkTab,
    },
    {
        id: "privacy",
        icon: LockIcon,
        content: PrivacyTab,
    },
    {
        id: "dev",
        icon: CodeXmlIcon,
        content: DevTab,
    },
];

/**
 * The about page.
 */
export function SettingsView() {
    return (
        <div className="w-5/6 h-full mx-auto flex flex-col gap-4">
            <SettingsAlert />

            <div className="grow min-h-0">
                <SettingsContent />
            </div>
        </div>
    );
}

function SettingsContent() {
    const [tab, setTab] = useSessionStorage("settings.tab", settingsTabs[0].id);
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    return (
        <Tabs
            selectedKey={tab}
            onSelectionChange={s => setTab(s.toString())}
            orientation="vertical"
            className="h-full"
        >
            <Tabs.ListContainer>
                <Tabs.List>
                    {settingsTabs.map(({ id, icon: Icon }) => (
                        <Tabs.Tab id={id} key={id}>
                            <span className="flex items-center gap-2">
                                <Icon />
                                <span className="break-keep">{t(`tabs.${id}`)}</span>
                            </span>
                            <Tabs.Indicator />
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs.ListContainer>
            {settingsTabs.map(({ id, content: Content }) => (
                <Tabs.Panel id={id} key={id} className="h-full w-full">
                    <div className="w-full h-full overflow-y-auto">
                        <div className="flex flex-col gap-6 w-full px-4 py-2">
                            <Content />
                        </div>
                    </div>
                </Tabs.Panel>
            ))}
        </Tabs>
    );
}

/**
 * An alert notifying user to change the settings with extra care.
 * @constructor
 */
function SettingsAlert() {
    const [hideAlert, setHideAlert] = useLocalStorage("settings.hideAlert", false);
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

    if (hideAlert) return null;

    return (
        <div className="w-full">
            <Alert
                status="warning"
                title={t("hint")}
                onClose={() => setHideAlert(true)}
                isClosable
            />
        </div>
    );
}
