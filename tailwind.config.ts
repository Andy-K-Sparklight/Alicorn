import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/renderer/**/*.{html,js,ts,jsx,tsx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {}
    },
    darkMode: "class",
    plugins: [heroui()]
} satisfies Config;