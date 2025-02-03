import react from "@vitejs/plugin-react";
import reactSWC from "@vitejs/plugin-react-swc";
import path from "node:path";
import tailwindcss from "tailwindcss";
import { defineConfig, PluginOption } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => {
    const isDev = command === "serve";

    process.env.NODE_ENV = isDev ? "development" : "production";

    return {
        root: path.resolve(import.meta.dirname, "..", "src", "renderer"),
        appType: "mpa",
        base: "",
        publicDir: path.resolve(import.meta.dirname, "..", "public"),
        build: {
            // Output directory will be specified when building
            emptyOutDir: true,
            chunkSizeWarningLimit: 1024,
            rollupOptions: {
                output: {
                    manualChunks: isDev ? undefined : {
                        heroui: ["@heroui/react"],
                        theme: ["@heroui/theme"],
                        lucide: ["lucide-react"]
                    }
                }
            }
        },
        plugins: [
            isDev ?
                reactSWC() :
                // Use React Compiler in production for better performance
                react({
                    babel: {
                        plugins: [
                            ["babel-plugin-react-compiler", { target: "19" }]
                        ]
                    }
                }),
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
        },
        esbuild: {
            legalComments: "none"
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
