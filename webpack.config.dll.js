// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DllPlugin = require("webpack/lib/DllPlugin");

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
  ],
  mode: "development",
};
