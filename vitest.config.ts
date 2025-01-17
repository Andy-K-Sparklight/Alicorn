import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    root: ".",
    test: {
        include: [
            "./test/**/*.test.ts"
        ]
    },
    plugins: [
        tsConfigPaths()
    ]
});