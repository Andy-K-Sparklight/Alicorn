import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

export default {
    content: [
        "./src/renderer/**/*.{html,js,ts,jsx,tsx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {}
    },
    darkMode: "class",
    plugins: [nextui()]
} satisfies Config;