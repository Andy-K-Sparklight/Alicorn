import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";
import themes from "~/themes";

export default {
    content: [
        "./src/renderer/**/*.{html,js,ts,jsx,tsx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {}
    },
    darkMode: "class",
    plugins: [heroui({ themes })]
} satisfies Config;
