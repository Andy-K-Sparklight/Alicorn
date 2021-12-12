const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { ContextReplacementPlugin } = require("webpack");
const BuildInfoPlugin = require("./BuildInfoPlugin");
const Version = require("./package.json").appVersion;

const MainDev = {
  entry: "./src/main/Bootstrap.ts",
  output: {
    filename: "Bootstrap.js",
    path: path.resolve(__dirname, "dist"),
    pathinfo: false,
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
            experimentalWatchApi: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      ws: path.resolve("./node_modules/ws/index.js"),
    },
  },
  plugins: [
    new BuildInfoPlugin("MainBuild.json", Version),
    new ContextReplacementPlugin(/keyv/),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "resources", "shared"),
          to: path.resolve(__dirname, "dist"),
        },
        {
          from: path.resolve(
            __dirname,
            "node_modules",
            "undici",
            "lib",
            "llhttp",
            "llhttp.wasm"
          ),
          to: path.resolve(__dirname, "dist", "llhttp", "llhttp.wasm"),
        },
        {
          from: path.resolve(
            __dirname,
            "node_modules",
            "undici",
            "lib",
            "llhttp",
            "llhttp_simd.wasm"
          ),
          to: path.resolve(__dirname, "dist", "llhttp", "llhttp_simd.wasm"),
        },
      ],
    }),
  ],
  devtool: "eval-source-map",
  mode: "development",
  target: "electron-main",
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
  watchOptions: {
    ignored: ["**/node_modules", "**/dist"],
  },
};

const RendererDev = {
  entry: {
    Renderer: "./src/renderer/Renderer.tsx",
    LibWorker: "./src/renderer/worker/LibWorker.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    pathinfo: false,
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
            experimentalWatchApi: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new BuildInfoPlugin("RendererBuild.json", Version),
    new ContextReplacementPlugin(/keyv/),
  ],
  devtool: "eval-source-map",
  mode: "development",
  target: "electron-renderer",
  watchOptions: {
    ignored: ["**/node_modules", "**/dist"],
  },
};

module.exports = [MainDev, RendererDev];
