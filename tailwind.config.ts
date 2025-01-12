import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

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