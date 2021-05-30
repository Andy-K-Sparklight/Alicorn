// MAINTAINERS ONLY
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DllPlugin = require("webpack/lib/DllPlugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BuildInfoPlugin = require("./BuildInfoPlugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Version = require("./package.json").version;
module.exports = {
  entry: {
    Twilight: ["react", "react-dom", "@material-ui/core", "@material-ui/icons"],
  },
  output: {
    filename: "[name].dll.js",
    path: path.resolve(__dirname, "dist"),
    library: "[name]",
  },
  plugins: [
    new BuildInfoPlugin("DllBuild.json", Version),
    new DllPlugin({
      name: "[name]",
      path: path.join(__dirname, "dist", "[name].manifest.json"),
    }),
  ],
  mode: "development",
};
