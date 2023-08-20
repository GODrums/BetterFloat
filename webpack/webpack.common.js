const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
    entry: {
      popup: path.join(srcDir, 'popup.ts'),
      background: path.join(srcDir, 'background.ts'),
      content_script: path.join(srcDir, 'content_script.ts'),
      inject: path.join(srcDir, 'inject.ts'),
      injectionhandler: path.join(srcDir, 'injectionhandler.ts'),
      eventhandler: path.join(srcDir, 'eventhandler.ts'),
      mappinghandler: path.join(srcDir, 'mappinghandler.ts'),
    },
    output: {
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks(chunk) {
              return chunk.name !== 'background';
            }
        },
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
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: ".", to: "../public", context: "public" },
                { from: ".", to: "../html", context: "html" },
                { from: ".", to: "../css", context: "css" },
                // copy manifest.json
                { from: "manifest.json", to: "../manifest.json" },
            ],
            options: {},
        }),
    ],
};
