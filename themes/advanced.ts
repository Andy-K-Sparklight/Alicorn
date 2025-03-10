import type { ConfigTheme } from "@heroui/react";

export default {
    extend: "dark",
    colors: {
        default: {
            "50": "#0f0f0f",
            "100": "#181818",
            "200": "#212121",
            "300": "#333333",
            "400": "#505050",
            "500": "#696969",
            "600": "#7a7a7a",
            "700": "#9e9e9e",
            "800": "#c2c2c2",
            "900": "#e6e6e6",
            foreground: "#fff",
            DEFAULT: "#505050"
        },
        primary: {
            "50": "#42000f",
            "100": "#690017",
            "200": "#900020",
            "300": "#b60028",
            "400": "#dd0031",
            "500": "#e32d55",
            "600": "#e95979",
            "700": "#ef869d",
            "800": "#f5b3c1",
            "900": "#fbdfe5",
            foreground: "#fff",
            DEFAULT: "#dd0031"
        },
        secondary: {
            "50": "#0f0f0f",
            "100": "#181818",
            "200": "#212121",
            "300": "#2a2a2a",
            "400": "#333333",
            "500": "#575757",
            "600": "#7a7a7a",
            "700": "#9e9e9e",
            "800": "#c2c2c2",
            "900": "#e6e6e6",
            foreground: "#fff",
            DEFAULT: "#333333"
        },
        success: {
            "50": "#193305",
            "100": "#285108",
            "200": "#376f0b",
            "300": "#458d0e",
            "400": "#54ab11",
            "500": "#72ba3b",
            "600": "#90c864",
            "700": "#aed78e",
            "800": "#cce6b8",
            "900": "#eaf5e1",
            foreground: "#fff",
            DEFAULT: "#54ab11"
        },
        warning: {
            "50": "#4d3d0e",
            "100": "#796117",
            "200": "#a6851f",
            "300": "#d2a828",
            "400": "#ffcc30",
            "500": "#ffd554",
            "600": "#ffde78",
            "700": "#ffe79d",
            "800": "#fff0c1",
            "900": "#fff9e5",
            foreground: "#fff",
            DEFAULT: "#ffcc30"
        },
        danger: {
            "50": "#4a1d02",
            "100": "#752d03",
            "200": "#a03e05",
            "300": "#cb4e06",
            "400": "#f65f07",
            "500": "#f87b32",
            "600": "#f9975e",
            "700": "#fbb389",
            "800": "#fccfb5",
            "900": "#feebe0",
            foreground: "#fff",
            DEFAULT: "#f65f07"
        },
        background: "#000000",
        content1: {
            DEFAULT: "#242424",
            foreground: "#fff"
        },
        content2: {
            DEFAULT: "#353535",
            foreground: "#fff"
        },
        content3: {
            DEFAULT: "#464646",
            foreground: "#fff"
        },
        content4: {
            DEFAULT: "#505050",
            foreground: "#fff"
        },
        focus: "#dd0031",
        overlay: "#ffffff"
    }
} satisfies ConfigTheme;
