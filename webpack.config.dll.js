// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DllPlugin = require("webpack/lib/DllPlugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require("copy-webpack-plugin");
module.exports = {
  entry: {
    Twilight: ["react", "react-dom", "@material-ui/core", "object-hash"],
  },
  output: {
    filename: "[name].dll.js",
    path: path.resolve(__dirname, "dist"),
    library: "[name]",
  },
  plugins: [
    new DllPlugin({
      name: "[name]",
      path: path.join(__dirname, "dist", "[name].manifest.json"),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src", "al-online"),
          to: path.resolve(__dirname, "dist", "api"),
        },
        {
          from: path.resolve(__dirname, "resources", "vercel"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
  ],
  mode: "development",
};
