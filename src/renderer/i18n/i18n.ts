import i18next, { BackendModule } from "i18next";
import languageDetector from "i18next-browser-languagedetector";
import { useEffect, useRef } from "react";
import { initReactI18next, useTranslation } from "react-i18next";
import YAML from "yaml";

const availableLanguages = ["zh-CN", "en"];
const namespaces = ["common", "pages"];

/**
 * Loading language resources from YAML files.
 */
const i18nLoader: BackendModule = {
    type: "backend",
    init: () => {},
    read: async (language, namespace) => {
        const dat = await (await fetch(`i18n/${language}/${namespace}.yml`)).text();
        return YAML.parse(dat);
    }
};

/**
 * Initializes i18n module.
 */
async function init(): Promise<void> {
    console.log("Initializing i18n...");
    await i18next
        .use(initReactI18next)
        .use(i18nLoader)
        .use(languageDetector)
        .init({
            ns: namespaces,
            fallbackLng: "zh-CN",
            interpolation: {
                escapeValue: false
            }
        });

    i18next.setDefaultNamespace(namespaces[0]);

    if (import.meta.env.AL_DEV && import.meta.hot) {
        // Handle i18n resource reload events
        import.meta.hot.on("locales-update", async () => {
            await i18next.reloadResources();
            await i18next.changeLanguage(i18next.language);
        });
    }
}

// CSS classes that have been defined
const definedFonts = new Set(["zh-CN", "zh", "en"]);

/**
 * A hook to automatically update font classes when the current locale changes.
 */
function useAutoFontClass() {
    const { i18n: { languages } } = useTranslation();
    const fontClass = useRef("");
    const newFontClass = languages?.find(it => definedFonts.has(it)) ?? "";

    useEffect(() => {
        if (fontClass.current) {
            document.documentElement.classList.remove(fontClass.current);
        }

        document.documentElement.classList.add(newFontClass);
        fontClass.current = newFontClass;
    }, [newFontClass]);
}

function getAvailableLanguages() {
    return availableLanguages;
}

export const i18n = {
    init, useAutoFontClass, getAvailableLanguages
};

