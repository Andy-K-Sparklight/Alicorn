import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { i18nLoader } from "@/renderer/i18n/loader";

const namespaces = ["common"];

/**
 * Initializes i18n module.
 */
async function init(): Promise<void> {
    console.log("Initializing i18n...");
    await i18next
        .use(initReactI18next)
        .use(i18nLoader)
        .use(LanguageDetector)
        .init({
            ns: namespaces,
            fallbackLng: "en",
            interpolation: {
                escapeValue: false
            }
        });
}

export const i18n = {
    init
};

