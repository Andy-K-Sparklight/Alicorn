import { i18n } from "@/renderer/i18n/i18n";
import { themeManager, useTheme } from "@/renderer/theme";
import { Divider } from "@heroui/react";
import { SelectEntry, TextEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { FileUserIcon, LanguagesIcon, PaletteIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";


/**
 * User preferences page.
 */
export function PreferencesTab() {
    const [config, makeReduce] = useConfig();

    const { theme, setTheme } = useTheme();
    const { i18n: i18next } = useTranslation();

    if (!config) return;

    return <>
        <TextEntry
            icon={FileUserIcon}
            id="pref.username"
            value={config.pref.username}
            onChange={makeReduce((c, v) => c.pref.username = v)}
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
            onChange={lang => i18next.changeLanguage(lang)}
            items={i18n.getAvailableLanguages()}
        />
    </>;
}
