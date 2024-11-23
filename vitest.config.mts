import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

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