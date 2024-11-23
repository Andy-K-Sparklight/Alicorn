const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { ContextReplacementPlugin } = require("webpack");
const BuildInfoPlugin = require("./BuildInfoPlugin");
const Version = require("./package.json").family;
const { DefinePlugin } = require("webpack");
const TsConfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const defines = {
    "import.meta.env.ALICORN_DEV": JSON.stringify(true)
};

const MainDev = {
    entry: {
        main: "./src/main/main.ts",
        preload: "./src/preload/preload.ts"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        pathinfo: false
    },
    module: {
        unknownContextCritical: false,
        rules: [
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, "src"),
                use: {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true,
                        experimentalWatchApi: true
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            ws: path.resolve("./node_modules/ws/index.js")
        },
        plugins: [
            new TsConfigPathsPlugin({})
        ]
    },
    plugins: [
        new BuildInfoPlugin("MainBuild.json", Version),
        new ContextReplacementPlugin(/keyv/),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "resources", "shared"),
                    to: path.resolve(__dirname, "dist")
                }
            ]
        }),
        new DefinePlugin(defines)
    ],
    devtool: "eval-source-map",
    mode: "development",
    target: "electron-main",
    externals: {
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate"
    },
    watchOptions: {
        ignored: ["**/node_modules", "**/dist"]
    }
};

const RendererDev = {
    entry: {
        Renderer: "./src/renderer/Renderer.tsx",
        LibWorker: "./src/renderer/worker/LibWorker.js"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        pathinfo: false
    },
    module: {
        unknownContextCritical: false,
        rules: [
            {
                test: /\.[tj]sx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true,
                        experimentalWatchApi: true
                    }
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
        new BuildInfoPlugin("RendererBuild.json", Version),
        new ContextReplacementPlugin(/keyv/),
        new DefinePlugin(defines)

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
            directory: path.resolve(__dirname, "dist")
        },
        compress: true,
        port: 9000,
        hot: true
    }

};

module.exports = [MainDev, RendererDev];
