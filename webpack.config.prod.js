const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { ContextReplacementPlugin } = require("webpack");
const BuildInfoPlugin = require("./BuildInfoPlugin");
const Version = require("./package.json").appVersion;
const WebVersion = require("./package.json").version;
const BannerPlugin = require("webpack").BannerPlugin;

const Main = {
  entry: "./src/main/Bootstrap.ts",
  output: {
    filename: "Bootstrap.js",
    path: path.resolve(__dirname, "dist", "release"),
  },
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new BuildInfoPlugin("MainBuild.json", Version),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "resources", "shared"),
          to: path.resolve(__dirname, "dist", "release"),
        },
      ],
    }),
    new ContextReplacementPlugin(/keyv/),
  ],
  mode: "production",
  target: "electron-main",
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
};

const Renderer = {
  entry: {
    Renderer: "./src/renderer/Renderer.tsx",
    LibWorker: "./src/renderer/worker/LibWorker.js",
    Starlight: "./src/starlight/Starlight.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist", "release"),
  },
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
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
  mode: "production",
  target: "electron-renderer",
};

const StarlightWeb = {
  entry: "./src/starlight/Starlight.ts",
  output: {
    filename: "Starlight.user.prod.js",
    path: path.resolve(__dirname, "dist"), // This is intentional
  },
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
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
  mode: "development", // This is intentional
  target: "web",
};

module.exports = [Main, Renderer, StarlightWeb];
