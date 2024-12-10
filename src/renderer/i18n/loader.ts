import { BackendModule } from "i18next";

export const i18nLoader = {
    type: "backend",
    init: () => {},
    read: async function (language, namespace) {
        return await native.i18n.getResource(language, namespace);
    }
} satisfies BackendModule;