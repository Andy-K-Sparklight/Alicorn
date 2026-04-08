import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, PluginOption } from "vite";
import removeConsole from "vite-plugin-remove-console";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";

export default defineConfig(({ command }) => {
    const isDev = command === "serve";

    process.env.NODE_ENV = isDev ? "development" : "production";

    return {
        root: path.resolve(import.meta.dirname, "..", "src", "renderer"),
        appType: "mpa",
        base: "",
        publicDir: path.resolve(import.meta.dirname, "..", "public"),
        cacheDir: path.resolve(import.meta.dirname, "..", ".vite-cache"),
        resolve: {
            tsconfigPaths: true
        },
        build: {
            emptyOutDir: true,
            chunkSizeWarningLimit: 1024,
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        groups: [
                            {
                                test: /node_modules\/@heroui\/react/,
                                name: "heroui"
                            },
                            {
                                test: /node_modules\/@heroui\/theme/,
                                name: "theme"
                            },
                            {
                                test: /node_modules\/lucide-react/,
                                name: "lucide"
                            }
                        ]
                    }
                }
            }
        },
        plugins: [
            isDev ?
                react() :
                [react(), babel({ presets: [reactCompilerPreset()] })],
            tailwindcss(),
            i18nHotReload(),
            removeConsole()
        ],
        define: {},
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
