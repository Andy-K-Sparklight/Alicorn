// MAINTAINERS ONLY
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BuildInfoPlugin = require("./BuildInfoPlugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Version = require("./package.json").version;
// noinspection JSValidateTypes
module.exports = {
  entry: "./src/starlight/Starlight.ts",
  output: {
    filename: "Starlight.js",
    path: path.resolve(__dirname, "dist"),
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
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [new BuildInfoPlugin("StarlightBuild.json", Version)],
  devtool: "source-map",
  mode: "development",
  target: "electron-preload",
};
