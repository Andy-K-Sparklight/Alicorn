import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import tailwindcss from "tailwindcss";
import { defineConfig, PluginOption } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => {
    const isDev = command === "serve";

    process.env.NODE_ENV = isDev ? "development" : "production";

    return {
        root: "./src/renderer",
        appType: "mpa",
        base: "",
        publicDir: path.resolve(import.meta.dirname, "public"),
        build: {
            outDir: path.resolve(import.meta.dirname, "build", isDev ? "dev" : "prod", "renderer"),
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks: isDev ? undefined : {
                        heroui: ["@heroui/react"],
                        motion: ["framer-motion"],
                        theme: ["@heroui/theme"],
                        octicons: ["@primer/octicons-react"]
                    }
                }
            }
        },
        plugins: [
            react(),
            tsConfigPaths(),
            i18nHotReload()
        ],
        define: {},
        css: {
            postcss: {
                plugins: [tailwindcss()]
            }
        },
        server: {
            warmup: {
                clientFiles: ["index.html"]
            }
        }
    };
});

function i18nHotReload(): PluginOption {
    return {
        name: "i18n-hot-reload",
        handleHotUpdate({ file, server }) {
            if (file.includes("i18n") && file.endsWith(".yml")) {
                server.ws.send({
                    type: "custom",
                    event: "locales-update"
                });
            }
        }
    };
}