import path from "node:path";
import { BannerPlugin, Configuration, ContextReplacementPlugin } from "webpack";
import { COPYRIGHT_NOTICE } from "~/build-config";
import TsConfigPathsPlugin from "tsconfig-paths-webpack-plugin";

export default {
    entry: {
        Renderer: "./src/renderer/Renderer.tsx",
        LibWorker: "./src/renderer/worker/LibWorker.js"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist", "prod")
    },
    module: {
        unknownContextCritical: false,
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" },
                    { loader: "postcss-loader" }
                ]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        plugins: [
            new TsConfigPathsPlugin({})
        ]
    },
    plugins: [
        new ContextReplacementPlugin(/keyv/),
        new BannerPlugin({
            banner: COPYRIGHT_NOTICE,
            entryOnly: true,
            include: ["Renderer", "LibWorker"]
        })
    ],
    externals: { "util/types": "commonjs util/types" },
    mode: "production",
    target: "electron-renderer"
} satisfies Configuration;
