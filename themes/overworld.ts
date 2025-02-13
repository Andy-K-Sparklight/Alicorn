import type { ConfigTheme } from "@heroui/react";

export default {
    extend: "dark",
    colors: {
        primary: {
            "50": "#12280c",
            "100": "#1d3f13",
            "200": "#275619",
            "300": "#326e20",
            "400": "#3c8527",
            "500": "#5e9a4d",
            "600": "#80b073",
            "700": "#a2c598",
            "800": "#c5dabe",
            "900": "#e7f0e4",
            foreground: "#fff",
            DEFAULT: "#3c8527"
        },
        secondary: {
            "50": "#2b1d0c",
            "100": "#3f2d17",
            "200": "#644824",
            "300": "#896231",
            "400": "#ae7d3f",
            "500": "#d3974c",
            "600": "#dba96b",
            "700": "#e2bb8b",
            "800": "#eaceaa",
            "900": "#f2e0c9",
            foreground: "#fff",
            DEFAULT: "#d3974c"
        },
        focus: "#3c8527"
    },

    layout: {
        radius: {
            small: "0px",
            medium: "0px",
            large: "0px"
        }
    }
} satisfies ConfigTheme;
