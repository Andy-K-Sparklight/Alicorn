import { i18n } from "@/renderer/i18n/i18n";
import { Root } from "@/renderer/Root";
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

    native.bwctl.show();
}

/**
 * Hides title popups on certain elements to make the LAF closer to native UI.
 */
function disableTitles() {
    window.addEventListener("mouseover", (e) => {
        if (e.target !== null && typeof e.target === "object" && "title" in e.target) {
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

void main();
