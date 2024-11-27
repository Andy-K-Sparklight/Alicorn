import path from "node:path";
import { type Configuration, ContextReplacementPlugin } from "webpack";
import TsConfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import "webpack-dev-server";

export default {
    entry: {
        Renderer: "./src/renderer/Renderer.tsx",
        LibWorker: "./src/renderer/worker/LibWorker.js"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist", "dev"),
        pathinfo: false
    },
    module: {
        unknownContextCritical: false,
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
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
        new ContextReplacementPlugin(/keyv/)
    ],
    devtool: "eval-source-map",
    mode: "development",
    target: "electron-renderer",
    watchOptions: {
        ignored: ["**/node_modules", "**/dist"]
    },
    externals: { "util/types": "commonjs util/types" },
    devServer: {
        static: {
            directory: path.resolve(__dirname, "dist", "dev")
        },
        compress: true,
        port: 9000,
        hot: true
    }
} satisfies Configuration;


