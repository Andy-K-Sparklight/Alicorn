import { Separator } from "@heroui/react";
import {
    ActionEntry,
    NumberTuningEntry,
    OnOffEntry,
    SelectEntry,
    TextEntry,
} from "@pages/settings/SettingsEntry";
import {
    FileUserIcon,
    HardDriveUploadIcon,
    LanguagesIcon,
    PaletteIcon,
    UserCogIcon,
    ZoomInIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/renderer/i18n/i18n";
import { useConfig } from "@/renderer/services/conf";
import { themeManager, useTheme } from "@/renderer/theme";
import { useNav } from "@/renderer/util/nav";

/**
 * User preferences page.
 */
export function PreferencesTab() {
    const { config, alterConfig } = useConfig();

    const { theme, setTheme } = useTheme();
    const { i18n: i18next } = useTranslation();

    const nav = useNav();

    if (!config) return null;

    function rerunSetup() {
        localStorage.removeItem("setup.done");
        nav("/setup");
    }

    return (
        <>
            <TextEntry
                icon={FileUserIcon}
                id="pref.username"
                value={config.pref.username}
                onChange={v => alterConfig(c => (c.pref.username = v))}
            />

            <Separator />

            <SelectEntry
                icon={PaletteIcon}
                id="pref.theme"
                value={theme}
                onChange={t => setTheme(t)}
                items={themeManager.getThemes()}
            />

            <Separator />

            <NumberTuningEntry
                icon={ZoomInIcon}
                id="pref.zoom"
                value={config.app.window.zoom}
                max={1000}
                min={10}
                step={10}
                toLabel={v => `${v}%`}
                onChange={v => {
                    alterConfig(c => (c.app.window.zoom = v));
                    native.bwctl.setZoom(v);
                }}
            />

            <Separator />

            <SelectEntry
                icon={LanguagesIcon}
                id="pref.language"
                value={i18next.language}
                onChange={lang => void i18n.alterLanguage(lang)}
                items={i18n.getAvailableLanguages()}
            />

            <Separator />

            <OnOffEntry
                icon={HardDriveUploadIcon}
                id="pref.hot-update"
                value={config.app.hotUpdate}
                onChange={v => alterConfig(c => (c.app.hotUpdate = v))}
            />

            <Separator />

            <ActionEntry id="pref.rerun-setup" icon={UserCogIcon} onClick={rerunSetup} />
        </>
    );
}
