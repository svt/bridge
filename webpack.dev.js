// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const path = require('path')
const common = require('./webpack.common')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const { merge } = require('webpack-merge')

const template = require('./app/template')

const dev = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: template({
        version: 'N/A',
        socketHost: 'ws://localhost:3000',
        apiHost: 'http://localhost:3000',
        env: 'development'
      }, [], '/')
    }),
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css'
    })
  ],
  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name].bundle.js'
  }
}

module.exports = common.map(config => {
  return merge(config, { ...dev })
})

module.exports[0].devServer = {
  static: {
    directory: path.join(__dirname, 'dist')
  },
  compress: true,
  port: 8080,
  historyApiFallback: true
}

/*
Allow all plugins to
be compiled in parallel
as they should not depend
on each other
*/
module.exports.parallelism = module.exports.length
