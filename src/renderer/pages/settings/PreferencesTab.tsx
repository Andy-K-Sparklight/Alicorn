import { i18n } from "@/renderer/i18n/i18n";
import { Divider } from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import { OnOffEntry, SelectEntry, TextEntry } from "@pages/settings/SettingsEntry";
import { useConfig } from "@pages/settings/use-config";
import { CommentIcon, MoonIcon, PersonIcon } from "@primer/octicons-react";
import React, { type FC } from "react";
import { useTranslation } from "react-i18next";

/**
 * User preferences page.
 */
export const PreferencesTab: FC = () => {
    const [config, makeReduce] = useConfig();

    const { theme, setTheme } = useTheme();
    const { i18n: i18next } = useTranslation();

    if (!config) return;

    return <>
        <TextEntry
            icon={PersonIcon}
            id="username"
            value={config.pref.username}
            onChange={makeReduce((c, v) => c.pref.username = v)}
        />

        <Divider/>

        <OnOffEntry
            icon={MoonIcon}
            id="dark"
            value={theme === "dark"}
            onChange={isDark => setTheme(isDark ? "dark" : "light")}
        />

        <Divider/>

        <SelectEntry
            icon={CommentIcon}
            id="language"
            value={i18next.language}
            onChange={lang => i18next.changeLanguage(lang)}
            items={i18n.getAvailableLanguages()}
        />
    </>;
};