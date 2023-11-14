const path = require('path');

const DotenvPlugin = require('dotenv-webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    popup: './src/popup.ts',
    background: './src/background.ts',
    csfloat_script: './src/csfloat/content_script.ts',
    inject: './src/inject.ts',
    injectionhandler: './src/injectionhandler.ts',
    eventhandler: './src/eventhandler.ts',
    mappinghandler: './src/mappinghandler.ts',
    skinport_script: './src/skinport/content_script.ts',
    skinbid_script: './src/skinbid/content_script.ts',
    helperfunctions: './src/util/helperfunctions.ts',
    extensionsettings: './src/util/extensionsettings.ts',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "fs": false
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/js'),
    clean: true,
  },
  plugins: [
    new DotenvPlugin(),
    new ESLintPlugin({
      extensions: ['js', 'ts'],
      overrideConfigFile: path.resolve(__dirname, '.eslintrc'),
    }),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
    }),
    new CopyPlugin({
      patterns: [
          { from: ".", to: "../public", context: "public" },
          { from: ".", to: "../html", context: "html" },
          { from: ".", to: "../css", context: "css" },
          { from: "**/*.js", to: "../js", context: "src" },
          // chrome manifest
          { from: "manifest.json", to: "../manifest.json" },
      ],
      options: {},
  }),
  ],
};
