import { App } from "@/renderer/App";
import { i18n } from "@/renderer/i18n/i18n";
import { globalStore } from "@/renderer/store/store";
import { ThemeSwitchProvider } from "@/renderer/theme";
import { addToast } from "@heroui/react";
import { t } from "i18next";
import { pEvent } from "p-event";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import pkg from "~/package.json";

// Styles and fonts
import "./global.css";
import "./fonts.css";
import "@fontsource-variable/noto-sans";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans-sc";

/**
 * Renderer main entry.
 */
async function main() {
    const startTime = performance.now();

    const { codename, version } = pkg;
    console.log(`Alicorn Launcher "${codename}" ${version}`);

    document.title = `Alicorn Launcher "${codename}"`;

    await Promise.all([
        pEvent(document, "DOMContentLoaded", { rejectionEvents: [] }),
        i18n.init()
    ]);

    console.log("Performing initial render.");
    render();

    const duration = Math.round(performance.now() - startTime) / 1000;

    console.log(`Done (${duration}s)! Showing window.`);

    native.bwctl.show();

    native.ext.onDevToolsOpened(printDevToolsWarn);

    native.app.onUpgraded(version => addToast({
        color: "success",
        title: t("toast.app-upgraded", { version })
    }));
}

function render() {
    createRoot(document.getElementById("app")!).render(
        <StrictMode>
            <Router hook={useHashLocation}>
                <ThemeSwitchProvider>
                    <ReduxProvider store={globalStore}>
                        <App/>
                    </ReduxProvider>
                </ThemeSwitchProvider>
            </Router>
        </StrictMode>
    );
}

/**
 * Warns the user when DevTools is opened in production mode.
 */
function printDevToolsWarn() {
    const tr = (s: string) => t(`devtools-warn.${s}`);

    console.log("%c" + tr("title"), "font-size: xxx-large; font-weight: bold; color: orange;");
    console.log("%c" + tr("sub-1"), "font-size: large; font-weight: bold; color: red;");
    console.log("%c" + tr("sub-2"), "font-size: xx-large; font-weight: bold; color: #ee4b2b;");
    console.log("%c" + tr("sub-3"), "color: orange;");
}

void main();
