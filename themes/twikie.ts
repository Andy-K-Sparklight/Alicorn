import type { ConfigTheme } from "@heroui/react";

export default {
    extend: "light",
    "colors": {
        "default": {
            "50": "#f8f0f4",
            "100": "#eedae4",
            "200": "#e4c4d5",
            "300": "#dbaec5",
            "400": "#d199b6",
            "500": "#c783a6",
            "600": "#a46c89",
            "700": "#81556c",
            "800": "#5f3e4f",
            "900": "#3c2732",
            "foreground": "#230c55",
            "DEFAULT": "#c783a6"
        },
        "primary": {
            "50": "#ebe4f1",
            "100": "#cebdde",
            "200": "#b297cb",
            "300": "#9670b8",
            "400": "#794aa4",
            "500": "#5d2391",
            "600": "#4d1d78",
            "700": "#3c175e",
            "800": "#2c1145",
            "900": "#1c0b2c",
            "foreground": "#fff",
            "DEFAULT": "#5d2391"
        },
        "secondary": {
            "50": "#fbe5ef",
            "100": "#f5c1d9",
            "200": "#f09dc2",
            "300": "#ea78ac",
            "400": "#e55495",
            "500": "#df307f",
            "600": "#b82869",
            "700": "#911f53",
            "800": "#6a173c",
            "900": "#430e26",
            "foreground": "#000",
            "DEFAULT": "#df307f"
        },
        "background": "#ffe0f0",
        "foreground": {
            "50": "#e8e2ed",
            "100": "#c8b9d5",
            "200": "#a891bc",
            "300": "#8768a3",
            "400": "#67408b",
            "500": "#471772",
            "600": "#3b135e",
            "700": "#2e0f4a",
            "800": "#220b36",
            "900": "#150722",
            "foreground": "#fff",
            "DEFAULT": "#471772"
        },
        "content1": {
            "DEFAULT": "#e2c3d3",
            "foreground": "#000"
        },
        "content2": {
            "DEFAULT": "#ceb1c1",
            "foreground": "#000"
        },
        "content3": {
            "DEFAULT": "#b091a2",
            "foreground": "#000"
        },
        "content4": {
            "DEFAULT": "#977c8a",
            "foreground": "#000"
        },
        "focus": "#5d2391",
        "overlay": "#000000",
        "divider": "#111111"
    }
} satisfies ConfigTheme;
