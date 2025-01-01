import { defineConfig } from "vite";
import path from "node:path";
import tsConfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "tailwindcss";

export default defineConfig(({ command }) => {
    const isDev = command === "serve";

    process.env.NODE_ENV = isDev ? "development" : "production";

    return {
        root: "./src/renderer",
        base: "",
        publicDir: path.resolve(import.meta.dirname, "public"),
        build: {
            outDir: path.resolve(import.meta.dirname, "build", isDev ? "dev" : "prod", "renderer"),
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks: isDev ? undefined : {
                        nextui: ["@nextui-org/react"],
                        octicons: ["@primer/octicons-react"]
                    }
                }
            }
        },
        plugins: [
            react(),
            tsConfigPaths()
        ],
        define: {},
        css: {
            postcss: {
                plugins: [tailwindcss()]
            }
        }
    };
});