import { BackendModule } from "i18next";
import YAML from "yaml";

export const i18nLoader = {
    type: "backend",
    init: () => {},
    read: async function (language, namespace) {
        const dat = await (await fetch(`i18n/${language}/${namespace}.yml`)).text();
        return YAML.parse(dat);
    }
} satisfies BackendModule;