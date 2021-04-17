// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require("copy-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ContextReplacementPlugin } = require("webpack");
// noinspection JSValidateTypes
module.exports = {
  entry: "./src/renderer/Renderer.tsx",
  output: {
    filename: "Renderer.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: "css-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".css"],
  },
  plugins: [
    new ContextReplacementPlugin(/keyv/),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "resources"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
  ],
  devtool: "source-map",
  mode: "development",
  target: "electron-renderer",
};
