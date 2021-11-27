const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { ContextReplacementPlugin } = require("webpack");
const BuildInfoPlugin = require("./BuildInfoPlugin");
const Version = require("./package.json").appVersion;
const WebVersion = require("./package.json").version;
const BannerPlugin = require("webpack").BannerPlugin;

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
            "v8-compile-cache",
            "v8-compile-cache.js"
          ),
          to: path.resolve(__dirname, "dist"),
        },
        {
          from: path.resolve(__dirname, "node_modules", "undici"),
          to: path.resolve(__dirname, "dist", "undici"),
        },
      ],
    }),
  ],
  devtool: "source-map",
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
    Starlight: "./src/starlight/Starlight.ts",
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
  devtool: "source-map",
  mode: "development",
  target: "electron-renderer",
  watchOptions: {
    ignored: ["**/node_modules", "**/dist"],
  },
  externals: {
    undici: "al_undici",
  },
};
const StarlightWebDev = {
  entry: "./src/starlight/Starlight.ts",
  output: {
    filename: "Starlight.dev.user.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
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
  devtool: false,
  plugins: [
    new BannerPlugin({
      banner:
        "// ==UserScript==\n// @name Starlight\n// @namespace https://starlight.xuogroup.top/\n" +
        `// @version ${WebVersion}\n// @run-at document-start\n// @description Extend Alicorn features to web!\n` +
        "// @author Andy K Rarity Sparklight\n// @match http*://**/*\n// @grant unsafeWindow\n// ==/UserScript==\n",
      raw: true,
      entryOnly: true,
    }),
  ],
  mode: "development",
  target: "web",
  watchOptions: {
    ignored: ["**/node_modules", "**/dist"],
  },
};

module.exports = [MainDev, RendererDev, StarlightWebDev];
