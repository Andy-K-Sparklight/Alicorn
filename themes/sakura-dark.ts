import type { ConfigTheme } from "@heroui/react";

export default {
    extend: "dark",
    colors: {
        default: {
            "50": "#1f161a",
            "100": "#291c21",
            "200": "#39262d",
            "300": "#483039",
            "400": "#745c66",
            "500": "#96828a",
            "600": "#b2a4aa",
            "700": "#cdc4c7",
            "800": "#eae6e8",
            "900": "#fdf4f8",
            foreground: "#fff",
            DEFAULT: "#573a45"
        },
        primary: {
            "50": "#492332",
            "100": "#73374e",
            "200": "#9e4b6b",
            "300": "#c86088",
            "400": "#f374a5",
            "500": "#f58cb5",
            "600": "#f7a5c5",
            "700": "#f9bdd4",
            "800": "#fbd5e4",
            "900": "#feeef4",
            foreground: "#000",
            DEFAULT: "#f374a5"
        },
        secondary: {
            "50": "#1a3f4a",
            "100": "#296475",
            "200": "#3889a0",
            "300": "#47aecb",
            "400": "#56d3f6",
            "500": "#74dbf8",
            "600": "#91e2f9",
            "700": "#afeafb",
            "800": "#ccf2fc",
            "900": "#eafafe",
            foreground: "#000",
            DEFAULT: "#56d3f6"
        },
        success: {
            "50": "#194430",
            "100": "#286c4c",
            "200": "#379469",
            "300": "#45bb85",
            "400": "#54e3a1",
            "500": "#72e8b1",
            "600": "#90edc2",
            "700": "#aef2d2",
            "800": "#ccf7e3",
            "900": "#eafcf3",
            foreground: "#000",
            DEFAULT: "#54e3a1"
        },
        warning: {
            "50": "#4d2d1d",
            "100": "#79482e",
            "200": "#a6623f",
            "300": "#d27d50",
            "400": "#ff9761",
            "500": "#ffa97d",
            "600": "#ffbb98",
            "700": "#ffceb4",
            "800": "#ffe0d0",
            "900": "#fff2eb",
            foreground: "#000",
            DEFAULT: "#ff9761"
        },
        danger: {
            "50": "#491616",
            "100": "#732323",
            "200": "#9d2f2f",
            "300": "#c83c3c",
            "400": "#f24949",
            "500": "#f46969",
            "600": "#f78989",
            "700": "#f9a9a9",
            "800": "#fbc8c8",
            "900": "#fde8e8",
            foreground: "#000",
            DEFAULT: "#f24949"
        },
        background: "#0b0b0b",
        foreground: {
            "50": "#4d4547",
            "100": "#796d70",
            "200": "#a69599",
            "300": "#d2bdc3",
            "400": "#ffe5ec",
            "500": "#ffeaef",
            "600": "#ffeef3",
            "700": "#fff3f6",
            "800": "#fff7f9",
            "900": "#fffcfd",
            foreground: "#000",
            DEFAULT: "#ffe5ec"
        },
        content1: {
            DEFAULT: "#101010",
            foreground: "#fff"
        },
        content2: {
            DEFAULT: "#232323",
            foreground: "#fff"
        },
        content3: {
            DEFAULT: "#363636",
            foreground: "#fff"
        },
        content4: {
            DEFAULT: "#494949",
            foreground: "#fff"
        },
        focus: "#ff86b5",
        overlay: "#ffffff",
        divider: "#ffffff"
    }
} satisfies ConfigTheme;
