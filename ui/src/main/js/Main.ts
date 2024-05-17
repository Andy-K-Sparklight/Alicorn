import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
import { renderApp } from "./Root";

setBasePath(".");

window.onload = () => {
    renderApp();
};