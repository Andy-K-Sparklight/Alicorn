const path = require("path");

const StarlightWeb = {
  entry: "./src/starlight/Starlight.ts",
  output: {
    filename: "Starlight.prod.user.js",
    path: path.resolve(__dirname, "out"),
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
  devtool: false,
  plugins: [
    new BannerPlugin({
      banner:
        "// ==UserScript==\n// @name Starlight\n// @namespace https://starlight.xuogroup.top/\n" +
        `// @version ${WebVersion}\n// @run-at document-start\n// @description Extend Alicorn features to web!\n` +
        "// @author Andy K Rarity Sparklight\n// @match http*://**/*\n// @grant unsafeWindow\n// ==/UserScript==\n",
      raw: true,
      entryOnly: true,
    }),
  ],
  mode: "development", // This is intentional
  target: "web",
};

module.exports = StarlightWeb;
