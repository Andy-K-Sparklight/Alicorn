import i18next, { BackendModule } from "i18next";
import { initReactI18next } from "react-i18next";
import languageDetector from "i18next-browser-languagedetector";
import YAML from "yaml";

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
}

// CSS classes that have been defined
const definedFonts = new Set(["zh-CN", "zh", "en"]);

function getFontClass(): string {
    return i18next.languages?.find(it => definedFonts.has(it)) ?? "";
}


export const i18n = {
    init, getFontClass
};

