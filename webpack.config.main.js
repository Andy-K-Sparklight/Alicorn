// MAINTAINERS ONLY
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require("copy-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ContextReplacementPlugin } = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BuildInfoPlugin = require("./BuildInfoPlugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Version = require("./package.json").appVersion;
// noinspection JSValidateTypes
module.exports = {
  entry: "./src/main/Bootstrap.ts",
  output: {
    filename: "Bootstrap.js",
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
    extensions: [".ts", ".js"],
  },
  plugins: [
    new BuildInfoPlugin("MainBuild.json", Version),
    new ContextReplacementPlugin(/keyv/),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "resources", "dev"),
          to: path.resolve(__dirname, "dist"),
        },
        {
          from: path.resolve(__dirname, "resources", "shared"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
  ],
  devtool: "source-map",
  mode: "development",
  target: "electron-main",
};
