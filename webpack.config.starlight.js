// MAINTAINERS ONLY
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BuildInfoPlugin = require("./BuildInfoPlugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Version = require("./package.json").appVersion;

const BannerPlugin = require("webpack").BannerPlugin;
const StarlightNode = {
  entry: "./src/starlight/Starlight.ts",
  output: {
    filename: "Starlight.js",
    path: path.resolve(__dirname, "dist"),
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
  plugins: [new BuildInfoPlugin("StarlightBuild.json", Version)],
  devtool: "source-map",
  mode: "development",
  target: "electron-preload",
};
const StarlightWeb = {
  entry: "./src/starlight/Starlight.ts",
  output: {
    filename: "Starlight.user.js",
    path: path.resolve(__dirname, "web"),
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
    new BannerPlugin({
      banner:
        "// ==UserScript==\n// @name Starlight\n// @namespace https://starlight.xuogroup.top/\n" +
        "// @version 1.0\n// @run-at document-start\n// @description Extend Alicorn features to web!\n" +
        "// @author Andy K Rarity Sparklight\n// @match http*://**/*\n// @grant unsafeWindow\n// ==/UserScript==\n",
      raw: true,
      entryOnly: true,
    }),
  ],
  mode: "development",
  target: "web",
};

module.exports = [StarlightNode, StarlightWeb];
