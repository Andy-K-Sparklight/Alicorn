const { nextui } = require("@nextui-org/react");

/** @type {import("tailwindcss").Config} */
module.exports = {
    content: [
        "./src/renderer/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {}
    },
    darkMode: "class",
    plugins: [nextui()]
};