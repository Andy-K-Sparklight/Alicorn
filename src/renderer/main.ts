import { i18n } from "@/renderer/i18n/i18n";
import { Root } from "@/renderer/Root";
import { t } from "i18next";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
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

    document.title = `Alicorn "${codename}"`;

    await Promise.all([
        new Promise<void>(res => document.addEventListener("DOMContentLoaded", () => res())),
        i18n.init()
    ]);

    disableTitles();

    console.log("Performing initial render.");
    render();

    const duration = Math.round(performance.now() - startTime) / 1000;

    console.log(`Done (${duration}s)! Showing window.`);

    printDevToolsWarn();

    native.bwctl.show();
}

/**
 * Hides title popups on certain elements to make the LAF closer to native UI.
 */
function disableTitles() {
    window.addEventListener("mouseover", (e) => {
        if (e.target !== null && typeof e.target === "object" && "title" in e.target && e.target.title) {
            e.target.title = "";
        }
    });
}

function render() {
    const rootEle = document.createElement("div");
    document.body.appendChild(rootEle);
    const root = createRoot(rootEle);
    root.render(createElement(Root));
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
