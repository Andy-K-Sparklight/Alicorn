// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ContextReplacementPlugin } = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BuildInfoPlugin = require("./BuildInfoPlugin");
// noinspection JSValidateTypes
module.exports = {
  entry: "./src/renderer/Renderer.tsx",
  output: {
    filename: "Renderer.js",
    path: path.resolve(__dirname, "dist", "release"),
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
    new BuildInfoPlugin("RendererBuild.json"),
    new ContextReplacementPlugin(/keyv/),
  ],
  mode: "production",
  target: "electron-renderer",
};
