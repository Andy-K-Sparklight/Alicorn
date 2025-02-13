import type { ConfigTheme } from "@heroui/react";

export default {
    extend: "light",
    "colors": {
        "default": {
            "50": "#d7dfe4",
            "100": "#c0d6ea",
            "200": "#b1cbdd",
            "300": "#9cb4c6",
            "400": "#8aa9bf",
            "500": "#738da0",
            "600": "#5a717d",
            "700": "#3f4d57",
            "800": "#242c32",
            "900": "#1b2225",
            "foreground": "#000",
            "DEFAULT": "#8aa9bf"
        },
        "primary": {
            "50": "#e8f4fa",
            "100": "#c7e5f4",
            "200": "#a7d6ed",
            "300": "#86c6e6",
            "400": "#66b7e0",
            "500": "#45a8d9",
            "600": "#398bb3",
            "700": "#2d6d8d",
            "800": "#215067",
            "900": "#153241",
            "foreground": "#000",
            "DEFAULT": "#45a8d9"
        },
        "secondary": {
            "50": "#fcf1f3",
            "100": "#f8dee3",
            "200": "#f4cbd3",
            "300": "#efb8c3",
            "400": "#eba5b2",
            "500": "#e792a2",
            "600": "#bf7886",
            "700": "#965f69",
            "800": "#6e454d",
            "900": "#452c31",
            "foreground": "#000",
            "DEFAULT": "#e792a2"
        },
        "background": "#daeff8",
        "foreground": {
            "50": "#e2e4e8",
            "100": "#babfc8",
            "200": "#9299a9",
            "300": "#6a7389",
            "400": "#424e69",
            "500": "#1a2849",
            "600": "#15213c",
            "700": "#111a2f",
            "800": "#0c1323",
            "900": "#080c16",
            "foreground": "#fff",
            "DEFAULT": "#1a2849"
        },
        "content1": {
            "DEFAULT": "#bde1f0",
            "foreground": "#000"
        },
        "content2": {
            "DEFAULT": "#b2d5e4",
            "foreground": "#000"
        },
        "content3": {
            "DEFAULT": "#9abfcf",
            "foreground": "#000"
        },
        "content4": {
            "DEFAULT": "#83b1c4",
            "foreground": "#000"
        },
        "focus": "#45a8d9",
        "overlay": "#000000",
        "divider": "#111111"
    }
} satisfies ConfigTheme;
