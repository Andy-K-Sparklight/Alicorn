import path from "node:path";
import { BannerPlugin, Configuration, ContextReplacementPlugin, DefinePlugin } from "webpack";
import { buildDefines, COPYRIGHT_NOTICE } from "~/build-config";
import TsConfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import esbuild from "esbuild";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

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
        new BannerPlugin({
            banner: COPYRIGHT_NOTICE,
            entryOnly: true,
            include: ["Renderer", "LibWorker"]
        }),
        new DefinePlugin(buildDefines),
        new ForkTsCheckerWebpackPlugin()
    ],
    externals: { "util/types": "commonjs util/types" },
    mode: "production",
    target: "electron-renderer"
} satisfies Configuration;
