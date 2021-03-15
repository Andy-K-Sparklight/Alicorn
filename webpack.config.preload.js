// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

// noinspection JSValidateTypes
module.exports = {
  entry: "./src/preload/Preload.js",
  output: {
    filename: "Preload.js",
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
  devtool: "source-map",
  mode: "development",
  target: "electron-preload",
};
