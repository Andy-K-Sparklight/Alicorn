import type { ConfigTheme } from "@heroui/react";

const color = {
    "50": "#ffffff",
    "100": "#ffffff",
    "200": "#ffffff",
    "300": "#ffffff",
    "400": "#f0f0f0",
    "500": "#e0e0e0",
    "600": "#d2d2d2",
    "700": "#a6a6a6",
    "800": "#797979",
    "900": "#4d4d4d",
    foreground: "#000",
    DEFAULT: "#f0f0f0"
};

export default {
    extend: "dark",
    colors: {
        primary: color,
        secondary: color,
        background: "#000000",
        foreground: "#ffffff",
        content1: {
            DEFAULT: "#18181b",
            foreground: "#fff"
        },
        content2: {
            DEFAULT: "#2b2b2b",
            foreground: "#fff"
        },
        content3: {
            DEFAULT: "#464646",
            foreground: "#fff"
        },
        content4: {
            DEFAULT: "#616161",
            foreground: "#fff"
        },
        focus: "#ffffff",
        overlay: "#ffffff"
    }
} satisfies ConfigTheme;
