const webpack = require("webpack");
const libraryName = "pigretto";
let outputFile;
const library = "pigretto";
const srcEntryPoint = "index.js";
const path = require("path");

const TerserPlugin = require("terser-webpack-plugin");
const env = process.env.WEBPACK_ENV;

if (env === "build") {
  outputFile = libraryName + ".ie11.min.js";
} else {
  outputFile = libraryName + ".ie11.js";
}

var config = {
  entry: {
    main: [
      "core-js/stable",
      "regenerator-runtime/runtime",
      __dirname + "/src/" + srcEntryPoint,
    ],
  },
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: outputFile,
    library: library,
    libraryTarget: "umd",
    globalObject: `(typeof self !== 'undefined' ? self : this)`,
    umdNamedDefine: true,
    libraryExport: "default",
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        exclude: /(node_modules\/core-js|bower_components)/,
        loader: "babel-loader",
        options: {
          babelrc: false,
          presets: [
            [
              "@babel/preset-env",
              // {
              //   targets: {
              //     browsers: "> 1%, IE 11, not dead",
              //   },
              // },
              {
                // corejs: {
                //   version: "3",
                //   proposals: true,
                // },
                // useBuiltIns: "usage",
                targets: {
                  browsers: [
                    "edge >= 16",
                    "safari >= 9",
                    "firefox >= 57",
                    "ie >= 11",
                    "ios >= 9",
                    "chrome >= 49",
                  ],
                },
              },
            ],
            {
              plugins: [
                "@babel/plugin-proposal-object-rest-spread",
                "@babel/plugin-proposal-class-properties",
                // [
                //   "@babel/plugin-transform-runtime",
                //   {
                //     regenerator: true,
                //   },
                // ],
              ],
            },
          ],
        },
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: "eslint-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
};

if (env === "build") {
  config.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  };
  config.mode = "production";
  config.devtool = false;
} else {
  config.mode = "development";
}

module.exports = config;
