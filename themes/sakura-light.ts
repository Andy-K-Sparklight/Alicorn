import type { ConfigTheme } from "@heroui/react";

export default {
    extend: "light",
    colors: {
        default: {
            "50": "#fcf0f2",
            "100": "#f8dbe0",
            "200": "#f5c6ce",
            "300": "#f1b1bb",
            "400": "#ed9ca9",
            "500": "#e98797",
            "600": "#c06f7d",
            "700": "#975862",
            "800": "#6f4048",
            "900": "#46292d",
            foreground: "#2a161b",
            DEFAULT: "#e98797"
        },
        primary: {
            "50": "#fff2f6",
            "100": "#fedfe9",
            "200": "#feccdb",
            "300": "#fdb9ce",
            "400": "#fda6c1",
            "500": "#fc93b4",
            "600": "#d07995",
            "700": "#a46075",
            "800": "#784656",
            "900": "#4c2c36",
            foreground: "#2d1820",
            DEFAULT: "#fc93b4"
        },
        secondary: {
            "50": "#e9f9fd",
            "100": "#c9f0fa",
            "200": "#aae7f7",
            "300": "#8bdef5",
            "400": "#6bd5f2",
            "500": "#4cccef",
            "600": "#3fa8c5",
            "700": "#31859b",
            "800": "#246172",
            "900": "#173d48",
            foreground: "#000",
            DEFAULT: "#4cccef"
        },
        success: {
            "50": "#e9f8f2",
            "100": "#caefe1",
            "200": "#aae5cf",
            "300": "#8bdcbd",
            "400": "#6cd2ac",
            "500": "#4dc99a",
            "600": "#40a67f",
            "700": "#328364",
            "800": "#255f49",
            "900": "#173c2e",
            foreground: "#000",
            DEFAULT: "#4dc99a"
        },
        warning: {
            "50": "#fff2eb",
            "100": "#ffe0d0",
            "200": "#ffceb4",
            "300": "#ffbb98",
            "400": "#ffa97d",
            "500": "#ff9761",
            "600": "#d27d50",
            "700": "#a6623f",
            "800": "#79482e",
            "900": "#4d2d1d",
            foreground: "#000",
            DEFAULT: "#ff9761"
        },
        danger: {
            "50": "#fde8e8",
            "100": "#fbc8c8",
            "200": "#f9a9a9",
            "300": "#f78989",
            "400": "#f46969",
            "500": "#f24949",
            "600": "#c83c3c",
            "700": "#9d2f2f",
            "800": "#732323",
            "900": "#491616",
            foreground: "#000",
            DEFAULT: "#f24949"
        },
        background: "#feeef5",
        foreground: {
            "50": "#eae1e4",
            "100": "#ccb7be",
            "200": "#ae8d97",
            "300": "#906371",
            "400": "#72394b",
            "500": "#540f25",
            "600": "#450c1f",
            "700": "#370a18",
            "800": "#280712",
            "900": "#19050b",
            foreground: "#fff",
            DEFAULT: "#540f25"
        },
        content1: {
            DEFAULT: "#fcf0f2",
            foreground: "#000"
        },
        content2: {
            DEFAULT: "#f8dbe0",
            foreground: "#000"
        },
        content3: {
            DEFAULT: "#f5c6ce",
            foreground: "#000"
        },
        content4: {
            DEFAULT: "#f1b1bb",
            foreground: "#000"
        },
        focus: "#ff86b5",
        overlay: "#000000",
        divider: "#111111"
    }
} satisfies ConfigTheme;
