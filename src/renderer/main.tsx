import { App } from "@/renderer/App";
import { i18n } from "@/renderer/i18n/i18n";
import { t } from "i18next";
import { pEvent } from "p-event";
import React from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import pkg from "~/package.json";

// Styles and fonts
import "./global.css";
import "./fonts.css";
import "@fontsource/ubuntu-mono";
import "@fontsource/noto-sans-sc";

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

    printDevToolsWarn();

    native.bwctl.show();
}

function Root() {
    return <React.StrictMode>
        <Router hook={useHashLocation}>
            <App/>
        </Router>
    </React.StrictMode>;
}

function render() {
    const rootEle = document.createElement("div");
    document.body.appendChild(rootEle);
    const root = createRoot(rootEle);
    root.render(<Root/>);
}

/**
 * Warns the user when DevTools is opened in production mode.
 */
function printDevToolsWarn() {
    if (!import.meta.env.AL_DEV) {
        const tr = (s: string) => t(`devtools-warn.${s}`);

        console.log("%c" + tr("title"), "font-size: xxx-large; font-weight: bold; color: orange;");
        console.log("%c" + tr("sub-1"), "font-size: large; font-weight: bold; color: red;");
        console.log("%c" + tr("sub-2"), "font-size: x-large; font-weight: bold; color: red;");
    }
}

void main();
