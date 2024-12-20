import path from "node:path";
import { type Configuration, ContextReplacementPlugin, DefinePlugin } from "webpack";
import TsConfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import "webpack-dev-server";
import { buildDefines } from "~/build-config";
import esbuild from "esbuild";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

export default {
    entry: {
        Renderer: "./src/renderer/Renderer.tsx",
        LibWorker: "./src/renderer/worker/LibWorker.js"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist", "dev")
    },
    module: {
        unknownContextCritical: false,
        rules: [
            {
                test: /\.[jt]sx?$/,
                loader: "esbuild-loader",
                options: {
                    target: "ESNext",
                    implementation: esbuild
                },
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" },
                    { loader: "postcss-loader" }
                ]
            },
            {
                test: /\.(woff(2)?|eot|ttf|otf)$/i,
                type: "asset",
                generator: {
                    filename: "fonts/[hash][ext][query]"
                }
            },
            {
                test: /\.(ico|gif|png|jpg|jpeg)$/i,
                type: "asset",
                generator: {
                    filename: "img/[hash][ext][query]"
                }
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
        new DefinePlugin(buildDefines),
        new ForkTsCheckerWebpackPlugin()
    ],
    devtool: "eval-source-map",
    mode: "development",
    target: "electron-renderer",
    watchOptions: {
        ignored: ["**/node_modules", "**/dist"]
    },
    cache: {
        type: "filesystem"
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


