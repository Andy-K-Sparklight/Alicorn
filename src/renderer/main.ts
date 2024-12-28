import { createRoot } from "react-dom/client";
import { Root } from "@/renderer/Root";
import { createElement } from "react";
import { i18n } from "@/renderer/i18n/i18n";
import pkg from "~/package.json";

// Styles and fonts
import "./global.css";
import "@fontsource/ubuntu-mono";
import "@fontsource/noto-sans-sc";

/**
 * Renderer main entry.
 */
async function main() {
    const { codename, version } = pkg;
    console.log(`Alicorn Launcher "${codename}" ${version}`);

    await i18n.init();

    render();

    native.bwctl.show();
}


function render() {
    const rootEle = document.createElement("div");
    document.body.appendChild(rootEle);
    const root = createRoot(rootEle);
    root.render(createElement(Root));
}

window.onload = () => main();