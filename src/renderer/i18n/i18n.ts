import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fsBackend from "i18next-fs-backend";
import path from "path";
import { getBasePath } from "@/modules/config/PathSolve.js";

/**
 * Initializes i18n module.
 */
async function init(): Promise<void> {
    console.log("Initializing i18n...");
    await i18next
        .use(initReactI18next)
        .use(LanguageDetector)
        .use(fsBackend)
        .init({
            ns: ["lang"],
            defaultNS: "lang",
            backend: {
                loadPath: (lng: string, ns: string) => path.resolve(getBasePath(), "i18n", lng, ns + ".yml")
            },
            fallbackLng: "en",
            interpolation: {
                escapeValue: false
            }
        });
}

export const i18n = {
    init
};

