const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { ContextReplacementPlugin } = require("webpack");
const BuildInfoPlugin = require("./BuildInfoPlugin");
const Version = require("./package.json").appVersion;
const BannerPlugin = require("webpack").BannerPlugin;

const Main = {
  entry: "./src/main/Bootstrap.ts",
  output: {
    filename: "Bootstrap.js",
    path: path.resolve(__dirname, "dist", "release"),
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
    alias: {
      ws: path.resolve("./node_modules/ws/index.js"),
    },
  },
  plugins: [
    new BuildInfoPlugin("MainBuild.json", Version),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "resources", "shared"),
          to: path.resolve(__dirname, "dist", "release"),
        },
        {
          from: path.resolve(
            __dirname,
            "node_modules",
            "undici",
            "lib",
            "llhttp",
            "llhttp.wasm"
          ),
          to: path.resolve(
            __dirname,
            "dist",
            "release",
            "llhttp",
            "llhttp.wasm"
          ),
        },
        {
          from: path.resolve(
            __dirname,
            "node_modules",
            "undici",
            "lib",
            "llhttp",
            "llhttp_simd.wasm"
          ),
          to: path.resolve(
            __dirname,
            "dist",
            "release",
            "llhttp",
            "llhttp_simd.wasm"
          ),
        },
      ],
    }),
    new ContextReplacementPlugin(/keyv/),
    new BannerPlugin({
      banner:
        "@license\nCopyright (C) 2021-2022 Annie K Rarity Sparklight\nThis program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\nYou should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.",
      entryOnly: true,
    }),
  ],
  mode: "production",
  target: "electron-main",
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
};

const Renderer = {
  entry: {
    Renderer: "./src/renderer/Renderer.tsx",
    LibWorker: "./src/renderer/worker/LibWorker.js",
    BotWorker: "./src/modules/boticorn/BotWorker.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist", "release"),
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
  plugins: [
    new BuildInfoPlugin("RendererBuild.json", Version),
    new ContextReplacementPlugin(/keyv/),
    new BannerPlugin({
      banner:
        "@license\nCopyright (C) 2021-2022 Andy K Rarity Sparklight\nThis program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\nYou should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.",
      entryOnly: true,
      include: ["Renderer", "LibWorker", "BotWorker"],
    }),
  ],
  externals: { "util/types": "commonjs util/types" },
  mode: "production",
  target: "electron-renderer",
};

module.exports = [Main, Renderer];
