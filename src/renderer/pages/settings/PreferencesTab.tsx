import { i18n } from "@/renderer/i18n/i18n";
import { useConfig } from "@/renderer/services/conf";
import { themeManager, useTheme } from "@/renderer/theme";
import { Divider } from "@heroui/react";
import { OnOffEntry, SelectEntry, TextEntry } from "@pages/settings/SettingsEntry";
import { FileUserIcon, HardDriveUploadIcon, LanguagesIcon, PaletteIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * User preferences page.
 */
export function PreferencesTab() {
    const { config, alterConfig } = useConfig();

    const { theme, setTheme } = useTheme();
    const { i18n: i18next } = useTranslation();

    if (!config) return null;

    return <>
        <TextEntry
            icon={FileUserIcon}
            id="pref.username"
            value={config.pref.username}
            onChange={v => alterConfig(c => c.pref.username = v)}
        />

        <Divider/>

        <SelectEntry
            icon={PaletteIcon}
            id="pref.theme"
            value={theme}
            onChange={t => setTheme(t)}
            items={themeManager.getThemes()}
        />

        <Divider/>

        <SelectEntry
            icon={LanguagesIcon}
            id="pref.language"
            value={i18next.language}
            onChange={lang => void i18n.alterLanguage(lang)}
            items={i18n.getAvailableLanguages()}
        />

        <Divider/>

        <OnOffEntry
            icon={HardDriveUploadIcon}
            id="pref.hot-update"
            value={config.app.hotUpdate}
            onChange={v => alterConfig(c => c.app.hotUpdate = v)}
        />
    </>;
}
