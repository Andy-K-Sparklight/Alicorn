// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require("copy-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BuildInfoPlugin = require("./BuildInfoPlugin");
// noinspection JSValidateTypes
module.exports = {
  entry: "./src/main/Bootstrap.ts",
  output: {
    filename: "Bootstrap.js",
    path: path.resolve(__dirname, "dist", "release"),
  },
  module: {
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
    new BuildInfoPlugin("MainBuild.json"),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "resources", "release"),
          to: path.resolve(__dirname, "dist", "release"),
        },
        {
          from: path.resolve(__dirname, "resources", "shared"),
          to: path.resolve(__dirname, "dist", "release"),
        },
      ],
    }),
  ],
  mode: "production",
  target: "electron-main",
};
