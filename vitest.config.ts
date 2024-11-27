import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";
import TypiaPlugin from "@ryoppippi/unplugin-typia/vite";

export default defineConfig({
    root: ".",
    test: {
        include: [
            "./test/**/*.test.ts"
        ]
    },
    plugins: [
        tsConfigPaths(),
        TypiaPlugin()
    ]
});